import sharp from 'sharp';
import fs from 'fs';
import path from 'url';
import fspath from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fspath.dirname(__filename);

const IMAGES_DIR = fspath.join(__dirname, 'public', 'images');

async function optimizeImages() {
  console.log('Starting luxury image compression and optimization (using safe .opt suffixes)...');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory does not exist: ${IMAGES_DIR}`);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR);

  for (const file of files) {
    const filePath = fspath.join(IMAGES_DIR, file);
    const ext = fspath.extname(file).toLowerCase();
    
    // Skip already optimized files
    if (file.includes('.opt.') || file.startsWith('temp_')) {
      continue;
    }

    try {
      const stats = fs.statSync(filePath);
      console.log(`Processing: ${file} (${(stats.size / 1024).toFixed(1)} KB)`);

      // 1. Heavy background/hero assets
      if (file.includes('b43c0ab3-fe3a-48b1-8640-12cf74c1a706') || file.includes('luxury_coffee_hero_bg')) {
        const outName = file.includes('b43c0ab3-fe3a-48b1-8640-12cf74c1a706') 
          ? 'b43c0ab3-fe3a-48b1-8640-12cf74c1a706.opt.webp' 
          : 'luxury_coffee_hero_bg.opt.webp';
        
        const outPath = fspath.join(IMAGES_DIR, outName);
        
        await sharp(filePath)
          .resize(1920, null, { withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(outPath);
        
        // Also save a copy as luxury_coffee_hero_bg.opt.webp if this is b43c0ab3
        if (file.includes('b43c0ab3-fe3a-48b1-8640-12cf74c1a706')) {
          const heroBgPath = fspath.join(IMAGES_DIR, 'luxury_coffee_hero_bg.opt.webp');
          await sharp(filePath)
            .resize(1920, null, { withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(heroBgPath);
        }

        const newStats = fs.statSync(outPath);
        console.log(`  -> Created optimized Hero asset: ${outName} (${(newStats.size / 1024).toFixed(1)} KB)`);
      } 
      else if (file === 'dispatch_vault.png') {
        const outName = 'dispatch_vault.opt.webp';
        const outPath = fspath.join(IMAGES_DIR, outName);
        
        await sharp(filePath)
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
        
        const newStats = fs.statSync(outPath);
        console.log(`  -> Created WebP: ${outName} (${(newStats.size / 1024).toFixed(1)} KB)`);
      }
      else if (ext === '.webp' || ext === '.jpeg' || ext === '.jpg') {
        // Product image thumbnails - target size < 50KB
        const baseName = fspath.basename(file, ext);
        const outName = `${baseName}.opt${ext}`;
        const outPath = fspath.join(IMAGES_DIR, outName);

        await sharp(filePath)
          .resize(480, null, { withoutEnlargement: true })
          .webp({ quality: 70 })
          .toFile(outPath);
        
        const newStats = fs.statSync(outPath);
        console.log(`  -> Created optimized Thumbnail: ${outName} (${(newStats.size / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }
  
  console.log('All images optimized and compressed safely with .opt suffixes!');
}

optimizeImages();
