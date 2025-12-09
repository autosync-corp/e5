#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_FILE = path.join(__dirname, '..', 'corvette-gallery.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'pages', 'gallery', 'constants', 'CorvetteGalleryData.ts');
const VARIABLE_NAME = 'corvetteGalleryData';

/**
 * Parse CSV line handling quoted fields that may contain commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

/**
 * Convert CSV to JSON
 */
function csvToJson(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Convert headers to camelCase for better JS compatibility
  const camelCaseHeaders = headers.map(header => {
    // Split by non-alphanumeric characters, filter empty strings
    const words = header.split(/[^a-zA-Z0-9]+/).filter(Boolean);

    // Convert to camelCase: first word lowercase, rest capitalized
    return words
      .map((word, index) => {
        const lowerWord = word.toLowerCase();
        if (index === 0) {
          return lowerWord;
        }
        return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      })
      .join('');
  });

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};

    camelCaseHeaders.forEach((header, index) => {
      const value = values[index] || '';
      // Convert empty strings to null for cleaner JSON
      row[header] = value === '' ? null : value;
    });

    data.push(row);
  }

  return data;
}

/**
 * Generate TypeScript file content
 */
function generateTSContent(data, variableName) {
  // Create a type interface based on the first object
  const firstItem = data[0];
  const typeDefinition = `export interface CorvetteGalleryItem {
${Object.keys(firstItem).map(key => `  ${key}: string | null;`).join('\n')}
}`;

  const jsonString = JSON.stringify(data, null, 2);

  return `${typeDefinition}

export const ${variableName}: CorvetteGalleryItem[] = ${jsonString};
`;
}

/**
 * Main function
 */
function main() {
  try {
    console.log('Reading CSV file:', CSV_FILE);
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');

    console.log('Converting CSV to JSON...');
    const jsonData = csvToJson(csvContent);

    console.log(`Processed ${jsonData.length} records`);

    console.log('Generating TypeScript content...');
    const tsContent = generateTSContent(jsonData, VARIABLE_NAME);

    console.log('Writing to file:', OUTPUT_FILE);
    fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');

    console.log('✅ Successfully created', OUTPUT_FILE);
    console.log(`   Variable name: ${VARIABLE_NAME}`);
    console.log(`   Records: ${jsonData.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
