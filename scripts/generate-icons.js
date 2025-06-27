const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [16, 48, 128];

async function generateIcons() {
    const svgBuffer = await fs.readFile(path.join(__dirname, '../src/assets/icon.svg'));
    
    // Ensure the dist/icons directory exists
    await fs.mkdir(path.join(__dirname, '../dist/icons'), { recursive: true });

    // Generate icons for each size
    for (const size of sizes) {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(path.join(__dirname, `../dist/icons/icon${size}.png`));
    }
}

generateIcons().catch(console.error); 