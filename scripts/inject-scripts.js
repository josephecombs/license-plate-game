const fs = require('fs');
const path = require('path');

// Read the asset manifest
const manifestPath = path.join(__dirname, '../build/asset-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Read the privacy policy HTML
const privacyPolicyPath = path.join(__dirname, '../build/privacy-policy.html');
let privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf8');

// Get the main script and CSS files
const mainJs = manifest.files['main.js'];
const mainCss = manifest.files['main.css'];

// Create the script and link tags
const scriptTag = `<script defer src="${mainJs}"></script>`;
const cssTag = `<link rel="stylesheet" href="${mainCss}">`;

// Insert the tags before the closing head tag
privacyPolicy = privacyPolicy.replace('</head>', `${cssTag}\n    ${scriptTag}\n  </head>`);

// Write back the modified HTML
fs.writeFileSync(privacyPolicyPath, privacyPolicy);

console.log('Successfully injected scripts into privacy-policy.html'); 