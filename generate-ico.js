/**
 * generate-ico.js
 * Converts icon-512.png to icon.ico using pure Node.js buffers.
 * Creates a single-resolution ICO (256x256 PNG-compressed) which is
 * valid for Windows desktop icons and electron-builder.
 */

const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, 'icon-512.png');
const icoPath = path.join(__dirname, 'icon.ico');

const pngData = fs.readFileSync(pngPath);

// ICO format: ICONDIR + ICONDIRENTRY + image data
// We use PNG-compressed image data (valid since Windows Vista)
// Reference: https://en.wikipedia.org/wiki/ICO_(file_format)

const ICO_HEADER_SIZE = 6;   // ICONDIR
const ICO_ENTRY_SIZE  = 16;  // ICONDIRENTRY

// ICONDIR (6 bytes)
const iconDir = Buffer.alloc(ICO_HEADER_SIZE);
iconDir.writeUInt16LE(0, 0);  // Reserved (must be 0)
iconDir.writeUInt16LE(1, 2);  // Type: 1 = ICO
iconDir.writeUInt16LE(1, 4);  // Count: 1 image

// ICONDIRENTRY (16 bytes)
const entry = Buffer.alloc(ICO_ENTRY_SIZE);
entry.writeUInt8(0, 0);   // Width  (0 = 256)
entry.writeUInt8(0, 1);   // Height (0 = 256)
entry.writeUInt8(0, 2);   // Color count (0 = no palette)
entry.writeUInt8(0, 3);   // Reserved
entry.writeUInt16LE(1, 4);   // Planes
entry.writeUInt16LE(32, 6);  // Bit count (32bpp)
entry.writeUInt32LE(pngData.length, 8);                          // Size of image data
entry.writeUInt32LE(ICO_HEADER_SIZE + ICO_ENTRY_SIZE, 12);       // Offset of image data

const ico = Buffer.concat([iconDir, entry, pngData]);
fs.writeFileSync(icoPath, ico);
console.log('icon.ico created successfully (' + ico.length + ' bytes)');
