const fs = require('fs');
const path = require('path');

// List of static pages that need script injection
const staticPages = [
  'privacy-policy.html',
  'terms-of-service.html',
  '404.html'
];

// Read the asset manifest
const manifestPath = path.join(__dirname, '../build/asset-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Get the main script and CSS files
const mainJs = manifest.files['main.js'];
const mainCss = manifest.files['main.css'];

// Create the script and link tags
const scriptTag = `<script defer src="${mainJs}"></script>`;
const cssTag = `<link rel="stylesheet" href="${mainCss}">`;

// Process each static page
staticPages.forEach(pageName => {
  const pagePath = path.join(__dirname, '../build', pageName);
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Insert the tags before the closing head tag
  pageContent = pageContent.replace('</head>', `${cssTag}\n    ${scriptTag}\n  </head>`);
  
  // Write back the modified HTML
  fs.writeFileSync(pagePath, pageContent);
  console.log(`Successfully injected scripts into ${pageName}`);
}); 