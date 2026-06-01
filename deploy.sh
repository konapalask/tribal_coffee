#!/bin/bash

# ==========================================
# Namecheap cPanel Git Deployment Script
# Framework Detection & Deployment Engine
# ==========================================

# Strict mode: Exit immediately if any command fails
set -e

# Target paths definition
PUBLIC_HTML="/home/backlzaj/public_html"
BACKEND_TARGET="/home/backlzaj/nodeapp"
REPO_PATH="/home/backlzaj/tribalcoffee-v2"

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
    
    # Navigate to frontend folder
    cd "$REPO_PATH/frontend"
    
    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install --production=false
    
    # Compile production bundle
    echo "Building production assets..."
    npm run build
    
    # Deploy dist contents to public_html (ensuring public_html exists)
    echo "Deploying built assets to public_html..."
    mkdir -p "$PUBLIC_HTML"
    
    # Sync dist folder to public_html cleanly (avoiding copying dist folder itself)
    /bin/cp -R dist/* "$PUBLIC_HTML/"
    
    echo "✔ React/Vite Frontend successfully deployed!"
fi

# 3. Deploy Node.js Backend
if [ "$IS_NODE_BACKEND" = true ]; then
    echo "--- Setting Up & Deploying Node.js Backend ---"
    
    # Ensure backend target directory exists
    mkdir -p "$BACKEND_TARGET"
    
    # Navigate to backend source
    cd "$REPO_PATH/backend"
    
    # Install backend production dependencies
    echo "Installing backend dependencies..."
    npm install --only=production
    
    # Deploy backend codebase to the designated cPanel Node.js directory
    echo "Deploying codebase to live application server..."
    # Copy all files from backend except lock files and node_modules (to avoid performance hit)
    rsync -av --exclude='node_modules' --exclude='.git' "$REPO_PATH/backend/" "$BACKEND_TARGET/"
    
    # Copy node_modules separately if needed or link them
    if [ -d "node_modules" ]; then
        rsync -av "node_modules/" "$BACKEND_TARGET/node_modules/"
    fi
    
    # Prepare production startup & restart Node app (Passenger restart mechanism)
    echo "Triggering zero-downtime application restart..."
    mkdir -p "$BACKEND_TARGET/tmp"
    touch "$BACKEND_TARGET/tmp/restart.txt"
    
    echo "✔ Node.js Backend successfully deployed & restarted!"
fi

# 4. Deploy Laravel Framework
if [ "$IS_LARAVEL" = true ]; then
    echo "--- Deploying Laravel Application ---"
    
    cd "$REPO_PATH"
    
    # Install dependencies via Composer
    echo "Installing composer packages..."
    composer install --no-dev --optimize-autoloader
    
    # Cache Configuration, Routes, and Views for production speed
    echo "Optimizing application cache..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    # Sync public assets to public_html
    echo "Deploying public assets to public_html..."
    mkdir -p "$PUBLIC_HTML"
    rsync -av public/ "$PUBLIC_HTML/"
    
    echo "✔ Laravel application successfully deployed!"
fi

echo "=== Deployment Successfully Completed: $(date) ==="
