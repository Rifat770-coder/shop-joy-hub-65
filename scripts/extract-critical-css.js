#!/usr/bin/env node

/**
 * Critical CSS extraction script
 * Extracts critical CSS for above-the-fold content to improve First Contentful Paint
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🎨 Extracting critical CSS...\n');

// Configuration
const config = {
  inputDir: path.join(projectRoot, 'dist'),
  outputDir: path.join(projectRoot, 'dist'),
  pages: [
    { url: '/', output: 'index-critical.css' },
    { url: '/products', output: 'products-critical.css' },
    { url: '/cart', output: 'cart-critical.css' },
    { url: '/checkout', output: 'checkout-critical.css' },
  ],
  viewport: { width: 1300, height: 900 },
};

async function extractCriticalCSS() {
  try {
    // Check if built files exist
    if (!fs.existsSync(config.inputDir)) {
      console.error('❌ dist directory not found. Build the project first.');
      console.log('Running: npm run build');
      execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
    }

    console.log('📝 Critical CSS extraction starting...');
    
    // In a real implementation, you would use a tool like:
    // - critical (https://github.com/addyosmani/critical)
    // - penthouse (https://github.com/pocketjoso/penthouse)
    // - purgecss (https://purgecss.com/)
    
    // For now, we'll create a placeholder implementation
    // that demonstrates the concept and provides guidance
    
    const criticalCSSContent = `/* Critical CSS extracted for Shop Joy Hub */
/* This CSS should be inlined in the <head> of your HTML */
/* Generated: ${new Date().toISOString()} */

/* Core styles for above-the-fold content */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
  background-color: #ffffff;
  color: #1a1a1a;
}

/* Critical layout components */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header/navigation critical styles */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Hero section critical styles */
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Loading skeleton for critical images */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Critical typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.5rem;
}

/* Critical button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

/* Critical form styles */
input, button, textarea, select {
  font: inherit;
}

/* Utility classes for critical layout */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.grid {
  display: grid;
}

/* Media queries for critical styles */
@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
`;

    // Create critical CSS files for each page
    config.pages.forEach(page => {
      const outputPath = path.join(config.outputDir, page.output);
      fs.writeFileSync(outputPath, criticalCSSContent);
      console.log(`✅ Created: ${page.output}`);
    });

    // Create a manifest file
    const manifest = {
      generated: new Date().toISOString(),
      pages: config.pages.map(p => ({
        url: p.url,
        criticalCSS: p.output,
        size: Buffer.byteLength(criticalCSSContent, 'utf8'),
      })),
      instructions: [
        '1. Inline the critical CSS in the <head> of your HTML',
        '2. Load the full CSS asynchronously',
        '3. Use the following pattern:',
        '   <style>/* critical CSS here */</style>',
        '   <link rel="stylesheet" href="/main.css" media="print" onload="this.media=\'all\'">',
      ],
    };

    const manifestPath = path.join(config.outputDir, 'critical-css-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('\n📋 Created: critical-css-manifest.json');
    console.log('\n🎯 Next steps:');
    console.log('1. Inline the critical CSS in your HTML <head>');
    console.log('2. Load full CSS asynchronously using media="print" technique');
    console.log('3. Test with Lighthouse to verify FCP improvement');
    console.log('\n💡 Tip: Consider using a build plugin like:');
    console.log('   - vite-plugin-critical');
    console.log('   - @fullhuman/postcss-purgecss');
    console.log('   - critters (for webpack)');

  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error.message);
    process.exit(1);
  }
}

// Generate PurgeCSS configuration
function generatePurgeCSSConfig() {
  const purgeConfig = {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    css: ['./src/**/*.css'],
    defaultExtractor: (content) => {
      // Extract Tailwind CSS classes
      const broadMatches = content.match(/[^<>"'`\\s]*[^<>"'`\\s:]/g) || [];
      const innerMatches = content.match(/[^<>"'`\\s.()]*[^<>"'`\\s.():]/g) || [];
      return broadMatches.concat(innerMatches);
    },
    safelist: {
      standard: [
        'html',
        'body',
        /^bg-/,
        /^text-/,
        /^border-/,
        /^hover:/,
        /^focus:/,
        /^active:/,
      ],
      deep: [],
      greedy: [],
    },
  };

  const configPath = path.join(projectRoot, 'purgecss.config.js');
  fs.writeFileSync(
    configPath,
    `// PurgeCSS configuration for critical CSS extraction
export default ${JSON.stringify(purgeConfig, null, 2)};`
  );
  
  console.log('\n📁 Created: purgecss.config.js');
  console.log('💡 Add to your build process:');
  console.log('   npm install @fullhuman/postcss-purgecss');
  console.log('   Then add to postcss.config.js');
}

// Run extraction
extractCriticalCSS();
generatePurgeCSSConfig();

console.log('\n✨ Critical CSS extraction complete!');
console.log('👉 Remember to implement actual critical CSS extraction in production.');
console.log('👉 Consider using: https://github.com/addyosmani/critical');