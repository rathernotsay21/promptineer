const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');
const toIco = require('png-to-ico');

// Sizes for Windows icons
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function convertSvgToIco() {
  try {
    console.log('Reading SVG file...');
    const svgBuffer = fs.readFileSync(path.join(__dirname, 'favicon.svg'));
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Generate PNGs of different sizes
    const pngFiles = [];
    
    for (const size of sizes) {
      console.log(`Converting to ${size}x${size} PNG...`);
      const pngBuffer = await svg2png(svgBuffer, { width: size, height: size });
      const pngPath = path.join(tempDir, `icon-${size}.png`);
      fs.writeFileSync(pngPath, pngBuffer);
      pngFiles.push(pngPath);
    }
    
    // Convert PNGs to ICO
    console.log('Creating ICO file...');
    const pngBuffers = pngFiles.map(file => fs.readFileSync(file));
    const icoBuffer = await toIco(pngBuffers);
    
    // Save ICO file
    fs.writeFileSync(path.join(__dirname, 'app-icon.ico'), icoBuffer);
    console.log('ICO file created successfully!');
    
    // Cleanup
    for (const file of pngFiles) {
      fs.unlinkSync(file);
    }
    fs.rmdirSync(tempDir);
    
  } catch (error) {
    console.error('Error creating icon:', error);
  }
}

convertSvgToIco();
