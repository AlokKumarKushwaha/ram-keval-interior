const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'images');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// User uploaded images paths
const srcLogo = 'C:/Users/v9919/.gemini/antigravity/brain/bd1e58ae-19cd-4820-ba4a-ce5bceb2b0b9/.user_uploaded/media_1790906644433.jpg';
const srcFounder = 'C:/Users/v9919/.gemini/antigravity/brain/bd1e58ae-19cd-4820-ba4a-ce5bceb2b0b9/.user_uploaded/media_1790907248896.jpg';
const srcCard = 'C:/Users/v9919/.gemini/antigravity/brain/bd1e58ae-19cd-4820-ba4a-ce5bceb2b0b9/.user_uploaded/media_1790831778441.jpg';

try {
    if (fs.existsSync(srcLogo)) {
        fs.copyFileSync(srcLogo, path.join(targetDir, 'logo.jpg'));
        console.log('✓ Copied logo.jpg');
    } else {
        console.log('Logo source not found at:', srcLogo);
    }

    if (fs.existsSync(srcFounder)) {
        fs.copyFileSync(srcFounder, path.join(targetDir, 'founder.jpg'));
        console.log('✓ Copied founder.jpg');
    } else {
        console.log('Founder source not found at:', srcFounder);
    }

    if (fs.existsSync(srcCard)) {
        fs.copyFileSync(srcCard, path.join(targetDir, 'visiting-card.jpg'));
        console.log('✓ Copied visiting-card.jpg');
    } else {
        console.log('Card source not found at:', srcCard);
    }

    console.log('All image assets successfully set up in images/ directory!');
} catch (err) {
    console.error('Error copying image files:', err);
}
