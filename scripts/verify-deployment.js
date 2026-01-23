#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * Checks if the application is ready for deployment to SiteGround
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Verifying deployment readiness...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify dist folder exists
console.log('✓ Checking dist folder...');
if (!fs.existsSync(path.join(rootDir, 'dist'))) {
  console.error('❌ ERROR: dist/ folder not found. Run "npm run build" first.');
  hasErrors = true;
} else {
  console.log('  ✅ dist/ folder exists');

  // Check dist/server
  if (!fs.existsSync(path.join(rootDir, 'dist', 'server'))) {
    console.error('  ❌ ERROR: dist/server/ not found');
    hasErrors = true;
  } else {
    console.log('  ✅ dist/server/ exists');
  }

  // Check dist/client
  if (!fs.existsSync(path.join(rootDir, 'dist', 'client'))) {
    console.error('  ❌ ERROR: dist/client/ not found');
    hasErrors = true;
  } else {
    console.log('  ✅ dist/client/ exists');
  }
}

// Check 2: Verify server.js exists
console.log('\n✓ Checking server.js...');
if (!fs.existsSync(path.join(rootDir, 'server.js'))) {
  console.error('❌ ERROR: server.js not found');
  hasErrors = true;
} else {
  console.log('  ✅ server.js exists');
}

// Check 3: Verify package.json
console.log('\n✓ Checking package.json...');
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  console.error('❌ ERROR: package.json not found');
  hasErrors = true;
} else {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  console.log('  ✅ package.json exists');

  // Check for start script
  if (!pkg.scripts || !pkg.scripts.start) {
    console.error('  ❌ ERROR: "start" script not found in package.json');
    hasErrors = true;
  } else {
    console.log('  ✅ "start" script found');
  }

  // Check for required dependencies
  const requiredDeps = ['@astrojs/node', 'stripe', 'vue'];
  requiredDeps.forEach(dep => {
    if (!pkg.dependencies || !pkg.dependencies[dep]) {
      console.error(`  ❌ ERROR: Required dependency "${dep}" not found`);
      hasErrors = true;
    }
  });
}

// Check 4: Verify .env.example exists
console.log('\n✓ Checking .env.example...');
if (!fs.existsSync(path.join(rootDir, '.env.example'))) {
  console.warn('⚠️  WARNING: .env.example not found');
  hasWarnings = true;
} else {
  console.log('  ✅ .env.example exists');
}

// Check 5: Verify .env does NOT exist in build (security)
console.log('\n✓ Checking .env (security)...');
if (fs.existsSync(path.join(rootDir, '.env'))) {
  console.log('  ⚠️  .env file exists locally (normal for development)');
  console.log('  ⚠️  Remember: Create new .env on server with PRODUCTION values');
  hasWarnings = true;
}

// Check 6: Look for hardcoded API keys (basic check)
console.log('\n✓ Checking for exposed secrets...');
const filesToCheck = [
  'dist/client/_astro',
  'src/core/constants/App.ts'
];

filesToCheck.forEach(relativePath => {
  const fullPath = path.join(rootDir, relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.lstatSync(fullPath).isDirectory()) {
        // Check JavaScript files in dist/client/_astro
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
          if (file.endsWith('.js')) {
            const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
            if (content.includes('sk_live_') || content.includes('sk_test_')) {
              console.error(`  ❌ ERROR: Stripe secret key found in ${file}`);
              hasErrors = true;
            }
          }
        });
      } else {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('efive') && content.includes('AUTOSYNC_API_KEY')) {
          console.warn('  ⚠️  WARNING: Hardcoded API key "efive" found in App.ts');
          console.warn('     Move this to environment variables before production!');
          hasWarnings = true;
        }
      }
    } catch (err) {
      // Ignore read errors
    }
  }
});

// Check 7: Node.js version
console.log('\n✓ Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error(`❌ ERROR: Node.js ${nodeVersion} detected. Version 18+ required.`);
  hasErrors = true;
} else {
  console.log(`  ✅ Node.js ${nodeVersion} (compatible)`);
}

// Check 8: File sizes (warn if too large)
console.log('\n✓ Checking bundle sizes...');
const clientPath = path.join(rootDir, 'dist', 'client');
if (fs.existsSync(clientPath)) {
  const getDirectorySize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
    return size;
  };

  const clientSize = getDirectorySize(clientPath);
  const clientSizeMB = (clientSize / (1024 * 1024)).toFixed(2);
  console.log(`  Client bundle size: ${clientSizeMB} MB`);

  if (clientSize > 10 * 1024 * 1024) {
    console.warn('  ⚠️  WARNING: Client bundle > 10MB. Consider optimization.');
    hasWarnings = true;
  } else {
    console.log('  ✅ Bundle size acceptable');
  }
}

// Final summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(50));

if (hasErrors) {
  console.error('\n❌ DEPLOYMENT NOT READY - Fix errors above before deploying.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  DEPLOYMENT READY WITH WARNINGS - Review warnings before deploying.');
  console.log('\nNext steps:');
  console.log('1. Review warnings above');
  console.log('2. Upload files to SiteGround');
  console.log('3. Create .env file on server with PRODUCTION values');
  console.log('4. Run: npm install --production');
  console.log('5. Start application via SiteGround Node.js Manager');
  console.log('\nSee DEPLOYMENT.md for detailed instructions.');
  process.exit(0);
} else {
  console.log('\n✅ DEPLOYMENT READY - All checks passed!');
  console.log('\nNext steps:');
  console.log('1. Upload files to SiteGround');
  console.log('2. Create .env file on server with PRODUCTION values');
  console.log('3. Run: npm install --production');
  console.log('4. Start application via SiteGround Node.js Manager');
  console.log('\nSee DEPLOYMENT.md for detailed instructions.');
  process.exit(0);
}
