# qrcode-generator

QR Code Generator for JavaScript.

## Version

1.4.4

## Source

- npm: https://www.npmjs.com/package/qrcode-generator
- GitHub: https://github.com/kazuhikoarase/qrcode-generator

## License

MIT License - Copyright (c) Kazuhiko Arase

## Usage

```javascript
// Create QR code (type number 0 = auto, error correction L/M/Q/H)
const qr = qrcode(0, 'M');
qr.addData('https://example.com');
qr.make();

// Get as image tag
const imgTag = qr.createImgTag(4, 8); // cell size, margin

// Get as data URL
const dataUrl = qr.createDataURL(4, 8);

// Get as SVG
const svg = qr.createSvgTag(4, 8);
```

## Update Instructions

```bash
curl -sL "https://unpkg.com/qrcode-generator@1.4.4/qrcode.js" \
  -o public/vendor/qrcode/qrcode.js
```

## File Size

~55 KB (unminified)
