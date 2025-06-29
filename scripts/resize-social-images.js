const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// Define the social media image sizes
const socialSizes = {
  'og-image': { width: 1200, height: 630 }, // Facebook/Open Graph
  'twitter-card': { width: 1200, height: 600 }, // Twitter
  'linkedin': { width: 1200, height: 627 }, // LinkedIn
  'pinterest': { width: 1000, height: 1500 }, // Pinterest
};

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '../public/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Source image path
const sourceImage = path.join(__dirname, '../platechase_og_image.png');

// Process each social media size
async function processImages() {
  try {
    const image = await Jimp.read(sourceImage);
    
    for (const [platform, dimensions] of Object.entries(socialSizes)) {
      const outputPath = path.join(assetsDir, `${platform}.png`);
      
      // Clone the image to avoid modifying the original
      const resizedImage = image.clone()
        .resize(dimensions.width, dimensions.height, Jimp.RESIZE_CONTAIN)
        .background(0xFFFFFFFF); // White background
      
      await resizedImage.writeAsync(outputPath);
      console.log(`Created ${platform} image at ${outputPath}`);
    }
    console.log('All social media images have been created successfully!');
  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

processImages(); 