#!/bin/bash

# ===================================================
# Namecheap cPanel Git Deployment & Preservation Script
# Multi-Framework (React/Vite, Node.js, Laravel)
# ===================================================

# Exit immediately if any command fails
set -e

# Target paths definition
PUBLIC_HTML="/home/backlzaj/public_html"
REPO_PATH="/home/backlzaj/tribalcoffee-v2"
APP_ROOT="$REPO_PATH/backend"
PERSISTENT_DATA="/home/backlzaj/persistent_data"
PERSISTENT_UPLOADS="/home/backlzaj/persistent_uploads"

echo "=== Deployment Started: $(date) ==="
echo "Repository Path: $REPO_PATH"

# 1. Framework Detection Engine
IS_VITE_REACT=false
IS_NODE_BACKEND=false
IS_LARAVEL=false

if [ -f "$REPO_PATH/frontend/package.json" ]; then
    IS_VITE_REACT=true
    echo "✔ Detected Framework: React/Vite (Frontend)"
fi

if [ -f "$REPO_PATH/backend/package.json" ]; then
    IS_NODE_BACKEND=true
    echo "✔ Detected Framework: Node.js (Backend)"
fi

if [ -f "$REPO_PATH/artisan" ] || [ -f "$REPO_PATH/composer.json" ]; then
    IS_LARAVEL=true
    echo "✔ Detected Framework: Laravel"
fi

# 2. Deploy React/Vite Frontend
if [ "$IS_VITE_REACT" = true ]; then
    echo "--- Building & Deploying React/Vite Frontend ---"
    
    cd "$REPO_PATH/frontend"
    echo "Installing frontend dependencies..."
    npm install --production=false
    
    echo "Building production assets..."
    npm run build
    
    echo "Deploying built assets to public_html..."
    mkdir -p "$PUBLIC_HTML"
    /bin/cp -R dist/* "$PUBLIC_HTML/"
    
    # Also deploy to the cPanel test subdomain subdirectory if configured
    SUBDOMAIN_PATH="$PUBLIC_HTML/test.tribalcoffee.in"
    echo "Deploying built assets to cPanel subdomain path: $SUBDOMAIN_PATH"
    mkdir -p "$SUBDOMAIN_PATH"
    /bin/cp -R dist/* "$SUBDOMAIN_PATH/"
    
    echo "✔ React/Vite Frontend successfully deployed to both production and staging endpoints!"
fi

# 3. Deploy Node.js Backend with Data Preservation
if [ "$IS_NODE_BACKEND" = true ]; then
    echo "--- Deploying Node.js Backend (Phusion Passenger) ---"
    
    # Ensure persistent volumes exist outside the git worktree
    mkdir -p "$PERSISTENT_DATA"
    mkdir -p "$PERSISTENT_UPLOADS"
    
    # Navigate to app directory
    cd "$APP_ROOT"
    
    # 3.1 Preserve Local JSON Database Data
    echo "Safeguarding database records (data/)..."
    if [ -d "data" ] && [ ! -L "data" ]; then
        # Seed persistent directory with fresh json data if new
        cp -R data/* "$PERSISTENT_DATA/" || true
        rm -rf data
    fi
    if [ ! -L "data" ]; then
        ln -s "$PERSISTENT_DATA" "data"
    fi
    
    # 3.2 Preserve User Uploads Media
    echo "Safeguarding user media uploads (public/uploads/)..."
    mkdir -p "public"
    if [ -d "public/uploads" ] && [ ! -L "public/uploads" ]; then
        cp -R public/uploads/* "$PERSISTENT_UPLOADS/" || true
        rm -rf public/uploads
    fi
    if [ ! -L "public/uploads" ]; then
        ln -s "$PERSISTENT_UPLOADS" "public/uploads"
    fi
    
    # 3.3 Install Production Dependencies
    echo "Installing production node dependencies..."
    npm install --only=production
    
    # 3.4 Trigger Hot Restart (Passenger)
    echo "Triggering zero-downtime Passenger restart..."
    mkdir -p "tmp"
    touch "tmp/restart.txt"
    
    echo "✔ Node.js Backend successfully deployed and hot-restarted!"
fi

# 4. Deploy Laravel Framework
if [ "$IS_LARAVEL" = true ]; then
    echo "--- Deploying Laravel Application ---"
    
    cd "$REPO_PATH"
    echo "Installing composer packages..."
    composer install --no-dev --optimize-autoloader
    
    echo "Optimizing application cache..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    echo "Deploying public assets to public_html..."
    mkdir -p "$PUBLIC_HTML"
    rsync -av public/ "$PUBLIC_HTML/"
    
    echo "✔ Laravel application successfully deployed!"
fi

echo "=== Deployment Successfully Completed: $(date) ==="
