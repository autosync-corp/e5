#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'gallery', 'corvette');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
const WEBP_QUALITY = 85; // Quality setting (0-100)
const DELETE_ORIGINALS = true; // Set to false to keep original files

/**
 * Check if file is an image (non-webp)
 */
function isConvertibleImage(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Convert single image to WebP
 */
async function convertToWebP(inputPath, quality = WEBP_QUALITY) {
  const dir = path.dirname(inputPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(dir, `${basename}.webp`);

  try {
    // Skip if WebP already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⚠ Skipped (already exists): ${path.basename(outputPath)}`);
      return { success: false, skipped: true, path: outputPath };
    }

    // Convert using sharp
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    console.log(`  ✓ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`    Size: ${formatBytes(inputSize)} → ${formatBytes(outputSize)} (${savings}% savings)`);

    return {
      success: true,
      skipped: false,
      inputPath,
      outputPath,
      inputSize,
      outputSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`  ✗ Failed to convert ${path.basename(inputPath)}: ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Process a directory
 */
async function processDirectory(dirPath) {
  console.log(`\nProcessing directory: ${dirPath}`);

  // Get all files recursively
  const allFiles = getAllFiles(dirPath);

  // Filter only convertible images
  const imageFiles = allFiles.filter(file => isConvertibleImage(file));

  if (imageFiles.length === 0) {
    console.log('  No images to convert.');
    return { converted: 0, skipped: 0, failed: 0 };
  }

  console.log(`Found ${imageFiles.length} images to convert\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  let totalInputSize = 0;
  let totalOutputSize = 0;

  // Process each image
  for (const imagePath of imageFiles) {
    const result = await convertToWebP(imagePath, WEBP_QUALITY);

    if (result.success) {
      converted++;
      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;

      // Delete original if configured
      if (DELETE_ORIGINALS) {
        try {
          fs.unlinkSync(result.inputPath);
          console.log(`    Deleted original: ${path.basename(result.inputPath)}`);
        } catch (error) {
          console.error(`    ⚠ Could not delete original: ${error.message}`);
        }
      }
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
    }
  }

  return {
    converted,
    skipped,
    failed,
    totalInputSize,
    totalOutputSize
  };
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Image to WebP Converter');
  console.log('='.repeat(60));

  // Get directory from command line or use default
  const targetDir = process.argv[2] || DEFAULT_DIR;

  // Check if directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`✗ Directory not found: ${targetDir}`);
    console.log('\nUsage: node convert-to-webp.js [directory]');
    process.exit(1);
  }

  if (!fs.statSync(targetDir).isDirectory()) {
    console.error(`✗ Path is not a directory: ${targetDir}`);
    process.exit(1);
  }

  console.log(`Quality: ${WEBP_QUALITY}%`);
  console.log(`Delete originals: ${DELETE_ORIGINALS ? 'Yes' : 'No'}`);

  // Process the directory
  const stats = await processDirectory(targetDir);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`✓ Successfully converted: ${stats.converted}`);
  console.log(`⚠ Skipped (already exist): ${stats.skipped}`);
  console.log(`✗ Failed: ${stats.failed}`);

  if (stats.converted > 0) {
    const totalSavings = ((1 - stats.totalOutputSize / stats.totalInputSize) * 100).toFixed(1);
    console.log(`\nTotal size reduction:`);
    console.log(`  Before: ${formatBytes(stats.totalInputSize)}`);
    console.log(`  After: ${formatBytes(stats.totalOutputSize)}`);
    console.log(`  Savings: ${formatBytes(stats.totalInputSize - stats.totalOutputSize)} (${totalSavings}%)`);
  }

  console.log('\nDone!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
