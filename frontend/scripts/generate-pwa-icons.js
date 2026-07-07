/**
 * Generate PWA icons using Node.js Canvas
 * Run: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// For now, create placeholder SVG files that browsers can use
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...\n');

sizes.forEach(size => {
  // Create SVG content with medical cross
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Blue gradient background -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
  
  <!-- Medical cross symbol -->
  <g fill="white">
    <!-- Vertical bar -->
    <rect 
      x="${size * 0.425}" 
      y="${size * 0.25}" 
      width="${size * 0.15}" 
      height="${size * 0.5}" 
      rx="${size * 0.02}"
    />
    <!-- Horizontal bar -->
    <rect 
      x="${size * 0.25}" 
      y="${size * 0.425}" 
      width="${size * 0.5}" 
      height="${size * 0.15}" 
      rx="${size * 0.02}"
    />
  </g>
  
  <!-- Text "SEM" -->
  <text 
    x="${size / 2}" 
    y="${size * 0.9}" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.12}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle"
  >SEM</text>
</svg>`;

  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For now, save as SVG (works for most browsers)
  // To convert to PNG, you'd need a library like 'sharp' or 'canvas'
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  
  fs.writeFileSync(svgFilepath, svg);
  console.log(`✓ Created ${svgFilename}`);
  
  // Create a symlink or copy SVG as PNG fallback
  // (browsers can render SVG as icons)
  try {
    fs.copyFileSync(svgFilepath, filepath);
  } catch (e) {
    // If copy fails, that's ok - SVG will work
  }
});

console.log('\n✅ PWA icons generated successfully!');
console.log('\nNote: Icons are in SVG format. For production, consider converting to PNG using:');
console.log('  npm install sharp');
console.log('  (then update this script to use sharp for PNG conversion)');
console.log('\nOr use an online tool like: https://realfavicongenerator.net/\n');
