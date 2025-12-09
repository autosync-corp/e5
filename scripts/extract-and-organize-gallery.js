#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GALLERY_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'gallery', 'corvette');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

/**
 * Extract E5-## pattern from filename
 */
function extractE5Number(filename) {
  const match = filename.match(/^(E5-\d+)/);
  return match ? match[1] : null;
}

/**
 * Check if file is an image
 */
function isImageFile(filename) {
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
 * Extract zip file using system unzip command
 */
async function extractZip(zipPath, outputDir) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use unzip command (available on macOS and most Unix systems)
    await execAsync(`unzip -q -o "${zipPath}" -d "${outputDir}"`);
    console.log(`✓ Extracted: ${path.basename(zipPath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to extract ${path.basename(zipPath)}:`, error.message);
    return false;
  }
}

/**
 * Rename images in directory sequentially
 */
function renameImagesSequentially(dirPath) {
  try {
    // Get all files recursively
    const allFiles = getAllFiles(dirPath);

    // Filter only image files
    const imageFiles = allFiles
      .filter(file => isImageFile(file))
      .sort(); // Sort to ensure consistent ordering

    if (imageFiles.length === 0) {
      console.log(`  ⚠ No images found in ${path.basename(dirPath)}`);
      return 0;
    }

    // Get the extension from the first image (assuming all are the same type)
    const firstExt = path.extname(imageFiles[0]);

    // Rename each image
    imageFiles.forEach((imagePath, index) => {
      const ext = path.extname(imagePath);
      const newName = `${index}${ext}`;
      const newPath = path.join(dirPath, newName);

      // Only rename if the name is different
      if (path.basename(imagePath) !== newName) {
        // If target file exists, use a temp name first
        if (fs.existsSync(newPath)) {
          const tempPath = path.join(dirPath, `temp_${Date.now()}_${index}${ext}`);
          fs.renameSync(imagePath, tempPath);
          fs.renameSync(tempPath, newPath);
        } else {
          fs.renameSync(imagePath, newPath);
        }
      }
    });

    console.log(`  ✓ Renamed ${imageFiles.length} images (0-${imageFiles.length - 1})`);
    return imageFiles.length;
  } catch (error) {
    console.error(`  ✗ Failed to rename images in ${path.basename(dirPath)}:`, error.message);
    return 0;
  }
}

/**
 * Clean up extracted directory by moving files to root and removing subdirs
 */
function flattenDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Get all files from subdirectory
        const subFiles = getAllFiles(filePath);

        // Move each file to parent directory
        subFiles.forEach(subFile => {
          const fileName = path.basename(subFile);
          const newPath = path.join(dirPath, fileName);

          // Only move if not already exists
          if (!fs.existsSync(newPath)) {
            fs.renameSync(subFile, newPath);
          }
        });

        // Remove the subdirectory
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    });
  } catch (error) {
    console.error(`  ⚠ Could not flatten directory ${path.basename(dirPath)}:`, error.message);
  }
}

/**
 * Process a single zip file
 */
async function processZipFile(zipPath) {
  const zipFilename = path.basename(zipPath);
  const e5Number = extractE5Number(zipFilename);

  if (!e5Number) {
    console.log(`⚠ Skipping ${zipFilename} - no E5 number found`);
    return false;
  }

  console.log(`\nProcessing: ${zipFilename}`);
  console.log(`E5 Number: ${e5Number}`);

  // Create a temporary extraction directory
  const tempDir = path.join(GALLERY_DIR, `temp_${e5Number}_${Date.now()}`);

  // Extract the zip file
  const extracted = await extractZip(zipPath, tempDir);
  if (!extracted) {
    return false;
  }

  // Flatten the directory structure
  flattenDirectory(tempDir);

  // Rename images sequentially
  const imageCount = renameImagesSequentially(tempDir);

  // Rename the directory to just E5 number
  const finalDir = path.join(GALLERY_DIR, e5Number);

  // If final directory exists, remove it first
  if (fs.existsSync(finalDir)) {
    console.log(`  ⚠ Directory ${e5Number} already exists, removing...`);
    fs.rmSync(finalDir, { recursive: true, force: true });
  }

  fs.renameSync(tempDir, finalDir);
  console.log(`  ✓ Created directory: ${e5Number}`);

  // Clean up: Remove the zip file
  try {
    fs.unlinkSync(zipPath);
    console.log(`  ✓ Deleted zip file: ${zipFilename}`);
  } catch (error) {
    console.error(`  ⚠ Could not delete zip file: ${error.message}`);
  }

  // Clean up: Remove old directory with full zip name (if exists)
  const oldDirName = zipFilename.replace('.zip', '');
  const oldDirPath = path.join(GALLERY_DIR, oldDirName);
  if (fs.existsSync(oldDirPath) && fs.statSync(oldDirPath).isDirectory()) {
    try {
      fs.rmSync(oldDirPath, { recursive: true, force: true });
      console.log(`  ✓ Deleted old directory: ${oldDirName}`);
    } catch (error) {
      console.error(`  ⚠ Could not delete old directory: ${error.message}`);
    }
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Gallery Image Organizer');
  console.log('='.repeat(60));
  console.log(`Gallery directory: ${GALLERY_DIR}\n`);

  // Check if directory exists
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error(`✗ Gallery directory not found: ${GALLERY_DIR}`);
    process.exit(1);
  }

  // Find all zip files
  const files = fs.readdirSync(GALLERY_DIR);
  const zipFiles = files
    .filter(file => file.endsWith('.zip'))
    .map(file => path.join(GALLERY_DIR, file));

  if (zipFiles.length === 0) {
    console.log('No zip files found in gallery directory.');
    process.exit(0);
  }

  console.log(`Found ${zipFiles.length} zip files\n`);

  // Process each zip file
  let successCount = 0;
  let failCount = 0;

  for (const zipPath of zipFiles) {
    const success = await processZipFile(zipPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Final cleanup: Remove any remaining zip files or old directories
  console.log('\n' + '='.repeat(60));
  console.log('Final Cleanup');
  console.log('='.repeat(60));

  const remainingFiles = fs.readdirSync(GALLERY_DIR);
  let cleanedZips = 0;
  let cleanedDirs = 0;

  remainingFiles.forEach(file => {
    const filePath = path.join(GALLERY_DIR, file);

    // Remove any remaining zip files
    if (file.endsWith('.zip')) {
      try {
        fs.unlinkSync(filePath);
        cleanedZips++;
        console.log(`✓ Removed zip: ${file}`);
      } catch (error) {
        console.error(`✗ Could not remove ${file}: ${error.message}`);
      }
    }

    // Remove directories that don't match E5-## pattern
    if (fs.statSync(filePath).isDirectory() && !file.match(/^E5-\d+$/)) {
      try {
        fs.rmSync(filePath, { recursive: true, force: true });
        cleanedDirs++;
        console.log(`✓ Removed old directory: ${file}`);
      } catch (error) {
        console.error(`✗ Could not remove ${file}: ${error.message}`);
      }
    }
  });

  if (cleanedZips === 0 && cleanedDirs === 0) {
    console.log('No additional files or directories to clean up.');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`✓ Successfully processed: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`Total zip files: ${zipFiles.length}`);
  console.log(`Cleaned up zip files: ${cleanedZips}`);
  console.log(`Cleaned up old directories: ${cleanedDirs}`);

  // Show final E5 directories
  const finalDirs = fs.readdirSync(GALLERY_DIR)
    .filter(file => file.match(/^E5-\d+$/))
    .sort();
  console.log(`\nFinal E5 directories: ${finalDirs.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
