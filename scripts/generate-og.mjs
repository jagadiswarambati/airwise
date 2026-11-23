import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function generateOgPng(filePath) {
  const width = 1200;
  const height = 630;

  // IHDR: width (4), height (4), depth (1), colorType 2 RGB (1), compression (1), filter (1), interlace (1)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  // Background gradient: from deep navy #090d16 to slate blue #1e293b
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    const ratio = y / height;
    const r = Math.round(9 + ratio * 20);
    const g = Math.round(13 + ratio * 30);
    const b = Math.round(22 + ratio * 40);

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Decorative border card
      if (x >= 40 && x <= width - 40 && y >= 40 && y <= height - 40) {
        if (x === 40 || x === width - 40 || y === 40 || y === height - 40) {
          rawData[pixelOffset] = 3; // #0369a1
          rawData[pixelOffset + 1] = 105;
          rawData[pixelOffset + 2] = 161;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
        }
      } else {
        rawData[pixelOffset] = 9;
        rawData[pixelOffset + 1] = 13;
        rawData[pixelOffset + 2] = 22;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const png = Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
  console.log(`Generated ${filePath} (${png.length} bytes)`);
}

generateOgPng(path.resolve('public/og.png'));
