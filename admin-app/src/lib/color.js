const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHex(value) {
  return HEX_RE.test((value || '').trim());
}

function expandHex(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return h;
}

export function hexToRgb(hex) {
  const full = expandHex(hex);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]) {
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function contrastRatio(hex1, hex2) {
  if (!isValidHex(hex1) || !isValidHex(hex2)) return null;
  const l1 = relativeLuminance(hexToRgb(hex1)) + 0.05;
  const l2 = relativeLuminance(hexToRgb(hex2)) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}
