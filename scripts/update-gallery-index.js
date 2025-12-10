#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GALLERY_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'gallery', 'corvette');
const DATA_FILE = path.join(__dirname, '..', 'src', 'pages', 'gallery', 'constants', 'CorvetteGalleryData.ts');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * Check if file is an image
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get images for a specific gallery ID
 */
function getGalleryImages(galleryId) {
  try {
    const galleryPath = path.join(GALLERY_DIR, galleryId);

    if (!fs.existsSync(galleryPath)) {
      return [];
    }

    const files = fs.readdirSync(galleryPath);
    const imageFiles = files
      .filter(file => isImageFile(file))
      .sort((a, b) => {
        // Sort numerically by the number in filename (e.g., 0.webp, 1.webp, 2.webp)
        const numA = parseInt(path.basename(a, path.extname(a)));
        const numB = parseInt(path.basename(b, path.extname(b)));

        // If both are numbers, sort numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }

        // Otherwise, sort alphabetically
        return a.localeCompare(b);
      });

    return imageFiles;
  } catch (error) {
    console.error(`  ✗ Error reading gallery ${galleryId}: ${error.message}`);
    return [];
  }
}

/**
 * Update the CorvetteGalleryData.ts file with image arrays
 */
function updateGalleryDataFile() {
  try {
    console.log('Reading CorvetteGalleryData.ts...');
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');

    // First, update the interface if it doesn't have images property
    let updatedContent = fileContent;

    if (!fileContent.includes('images?:')) {
      console.log('Adding images property to interface...');
      updatedContent = updatedContent.replace(
        /export interface CorvetteGalleryItem \{([^}]+)\}/,
        (match, properties) => {
          return `export interface CorvetteGalleryItem {${properties}  images?: string[];\n}`;
        }
      );
    }

    // Parse the data array to extract galleryIds
    console.log('Scanning for gallery entries...\n');

    let stats = {
      total: 0,
      updated: 0,
      noGallery: 0,
      noImages: 0,
      totalImages: 0
    };

    // Process each vehicle entry
    updatedContent = updatedContent.replace(
      /({\s*\n\s*"galleryId":\s*"(E5-\d+)"[\s\S]*?)(,\s*\n\s*"tireModel":\s*(?:"[^"]*"|null)\s*\n\s*})/g,
      (match, prefix, galleryId, suffix) => {
        stats.total++;

        // Get images for this gallery
        const images = getGalleryImages(galleryId);

        if (images.length === 0) {
          console.log(`  ⚠ ${galleryId}: No images found`);
          stats.noImages++;
          return match; // Return unchanged
        }

        stats.updated++;
        stats.totalImages += images.length;
        console.log(`  ✓ ${galleryId}: Added ${images.length} images`);

        // Check if images property already exists
        if (match.includes('"images":')) {
          // Update existing images array
          return match.replace(
            /"images":\s*\[[^\]]*\]/,
            `"images": ${JSON.stringify(images)}`
          );
        } else {
          // Add new images property before the closing brace
          return `${prefix}${suffix.replace(
            /(\s*\n\s*})/,
            `,\n    "images": ${JSON.stringify(images)}$1`
          )}`;
        }
      }
    );

    // Also handle entries with null galleryId
    const nullGalleryMatches = updatedContent.match(/"galleryId":\s*null/g);
    if (nullGalleryMatches) {
      stats.noGallery = nullGalleryMatches.length;
    }

    // Write the updated content back to the file
    console.log('\nWriting updated data to file...');
    fs.writeFileSync(DATA_FILE, updatedContent, 'utf-8');

    return stats;
  } catch (error) {
    console.error(`✗ Failed to update data file: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(60));
  console.log('Gallery Data Updater');
  console.log('='.repeat(60));
  console.log(`Gallery directory: ${GALLERY_DIR}`);
  console.log(`Data file: ${DATA_FILE}\n`);

  // Check if directories exist
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error(`✗ Gallery directory not found: ${GALLERY_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`✗ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  // Update the data file
  const stats = updateGalleryDataFile();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total entries: ${stats.total}`);
  console.log(`✓ Updated with images: ${stats.updated}`);
  console.log(`⚠ No images found: ${stats.noImages}`);
  console.log(`⚠ No gallery ID: ${stats.noGallery}`);
  console.log(`Total images indexed: ${stats.totalImages}`);
}

main();
