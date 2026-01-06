/**
 * QRCodeHelper.js - Client-side QR code generation
 *
 * Provides utility functions for generating QR codes in two sizes:
 * - Normal: For result page (user saves link)
 * - Large: For teacher session (classroom projection)
 */

/**
 * QR code size presets
 */
const QR_SIZES = {
  normal: {
    cellSize: 4,
    margin: 4,
    description: 'Standard size for saving links'
  },
  large: {
    cellSize: 10,
    margin: 8,
    description: 'Large size for classroom projection'
  }
};

/**
 * Generate a QR code as an img element
 *
 * @param {string} url - The URL to encode
 * @param {('normal'|'large')} size - Size preset
 * @returns {HTMLImageElement} The generated img element
 */
export function createQRCodeImage(url, size = 'normal') {
  if (typeof qrcode === 'undefined') {
    console.error('QRCodeHelper: qrcode library not loaded');
    return null;
  }

  const preset = QR_SIZES[size] || QR_SIZES.normal;

  // Type 0 = auto-detect size, 'M' = medium error correction
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const img = document.createElement('img');
  img.src = qr.createDataURL(preset.cellSize, preset.margin);
  img.alt = 'QR Code';
  img.className = `qr-code qr-code-${size}`;

  return img;
}

/**
 * Generate a QR code container with optional label
 *
 * @param {string} url - The URL to encode
 * @param {('normal'|'large')} size - Size preset
 * @param {string} [label] - Optional label text below the QR code
 * @returns {HTMLDivElement} Container with QR code and optional label
 */
export function createQRCodeContainer(url, size = 'normal', label = null) {
  const container = document.createElement('div');
  container.className = `qr-code-container qr-code-container-${size}`;

  const img = createQRCodeImage(url, size);
  if (img) {
    container.appendChild(img);
  }

  if (label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'qr-code-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * Get QR code as data URL string
 *
 * @param {string} url - The URL to encode
 * @param {('normal'|'large')} size - Size preset
 * @returns {string|null} Data URL or null if library not loaded
 */
export function getQRCodeDataURL(url, size = 'normal') {
  if (typeof qrcode === 'undefined') {
    console.error('QRCodeHelper: qrcode library not loaded');
    return null;
  }

  const preset = QR_SIZES[size] || QR_SIZES.normal;

  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  return qr.createDataURL(preset.cellSize, preset.margin);
}
