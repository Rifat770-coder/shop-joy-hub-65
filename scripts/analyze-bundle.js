#!/usr/bin/env node

/**
 * Bundle analysis script
 * Analyzes the production bundle for optimization opportunities
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('📦 Analyzing bundle size...\n');

// Ensure dist directory exists
const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Building project first...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
  } catch (error) {
    console.error('Failed to build project:', error.message);
    process.exit(1);
  }
}

// Analyze bundle size
function analyzeBundleSize() {
  console.log('📊 Bundle Size Analysis:');
  console.log('='.repeat(50));
  
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('Assets directory not found');
    return;
  }
  
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  let totalSize = 0;
  let gzippedTotal = 0;
  
  console.log('\nJavaScript Files:');
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    // Estimate gzipped size (roughly 30% of original)
    const gzippedKB = (stats.size * 0.3 / 1024).toFixed(2);
    
    totalSize += stats.size;
    gzippedTotal += stats.size * 0.3;
    
    console.log(`  ${file}:`);
    console.log(`    Size: ${sizeKB} KB`);
    console.log(`    Gzipped: ~${gzippedKB} KB`);
    
    // Check if file is too large (> 500KB)
    if (stats.size > 500 * 1024) {
      console.log(`    ⚠️  Warning: File exceeds 500KB`);
    }
  });
  
  console.log('\nCSS Files:');
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const gzippedKB = (stats.size * 0.3 / 1024).toFixed(2);
    
    totalSize += stats.size;
    gzippedTotal += stats.size * 0.3;
    
    console.log(`  ${file}:`);
    console.log(`    Size: ${sizeKB} KB`);
    console.log(`    Gzipped: ~${gzippedKB} KB`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('Total Bundle Size:');
  console.log(`  Original: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`  Gzipped: ~${(gzippedTotal / 1024).toFixed(2)} KB`);
  
  // Performance recommendations
  console.log('\n🎯 Performance Recommendations:');
  
  if (totalSize > 2 * 1024 * 1024) { // > 2MB
    console.log('  ⚠️  Bundle is large (> 2MB). Consider:');
    console.log('     - Implementing code splitting');
    console.log('     - Lazy loading non-critical components');
    console.log('     - Removing unused dependencies');
  } else if (totalSize > 1 * 1024 * 1024) { // > 1MB
    console.log('  ℹ️  Bundle is moderate size (> 1MB). Consider:');
    console.log('     - Checking for duplicate dependencies');
    console.log('     - Optimizing images and assets');
  } else {
    console.log('  ✅ Bundle size is good (< 1MB)');
  }
  
  // Check for common optimization opportunities
  console.log('\n🔍 Optimization Opportunities:');
  
  // Check package.json for large dependencies
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  );
  
  const largeDeps = [
    'moment', 'lodash', 'axios', 'react-query', 'recharts', 'appwrite'
  ];
  
  const installedLargeDeps = largeDeps.filter(dep => 
    packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  );
  
  if (installedLargeDeps.length > 0) {
    console.log('  Large dependencies detected:');
    installedLargeDeps.forEach(dep => {
      console.log(`    - ${dep}: Consider alternatives or tree-shaking`);
    });
  }
  
  // Check for duplicate React
  const reactVersions = [
    packageJson.dependencies?.react,
    packageJson.dependencies?.['react-dom']
  ].filter(Boolean);
  
  if (new Set(reactVersions).size > 1) {
    console.log('  ⚠️  Multiple React versions detected');
  }
}

// Analyze dependency duplicates
function analyzeDependencies() {
  console.log('\n📦 Dependency Analysis:');
  console.log('='.repeat(50));
  
  try {
    // Run npm ls to get dependency tree
    const result = execSync('npm ls --all --json', { 
      cwd: projectRoot,
      encoding: 'utf8' 
    });
    
    const tree = JSON.parse(result);
    
    // Find duplicates (simplified check)
    console.log('\nChecking for common issues:');
    
    // Check for peer dependency issues
    if (tree.problems && tree.problems.length > 0) {
      console.log('  ⚠️  Dependency problems found:');
      tree.problems.slice(0, 5).forEach(problem => {
        console.log(`    - ${problem}`);
      });
    } else {
      console.log('  ✅ No dependency problems found');
    }
    
  } catch (error) {
    console.log('  ℹ️  Could not analyze dependency tree (npm ls failed)');
  }
}

// Generate optimization report
function generateReport() {
  console.log('\n📋 Optimization Report:');
  console.log('='.repeat(50));
  
  const recommendations = [
    {
      title: 'Code Splitting',
      description: 'Implement route-based code splitting',
      impact: 'High',
      effort: 'Medium',
      command: '// Use React.lazy() and Suspense for routes'
    },
    {
      title: 'Tree Shaking',
      description: 'Ensure unused code is eliminated',
      impact: 'Medium',
      effort: 'Low',
      command: '// Check tsconfig.json has "module": "ESNext"'
    },
    {
      title: 'Image Optimization',
      description: 'Use next-gen formats (WebP, AVIF)',
      impact: 'High',
      effort: 'Medium',
      command: '// Use OptimizedImage component'
    },
    {
      title: 'Dependency Audit',
      description: 'Remove unused dependencies',
      impact: 'Medium',
      effort: 'Low',
      command: 'npm run depcheck'
    },
    {
      title: 'Bundle Visualization',
      description: 'Visualize bundle composition',
      impact: 'Low',
      effort: 'Low',
      command: 'npm run build -- --profile'
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`\n${rec.title}:`);
    console.log(`  Description: ${rec.description}`);
    console.log(`  Impact: ${rec.impact}`);
    console.log(`  Effort: ${rec.effort}`);
    console.log(`  Command: ${rec.command}`);
  });
}

// Main execution
try {
  analyzeBundleSize();
  analyzeDependencies();
  generateReport();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Bundle analysis complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run build:analyze" for visual bundle analysis');
  console.log('2. Check "dist/report.html" for detailed breakdown');
  console.log('3. Implement recommendations from the report');
  
} catch (error) {
  console.error('Error during bundle analysis:', error.message);
  process.exit(1);
}