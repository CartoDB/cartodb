import * as cartoColors from 'cartocolor';

export const NULL_COLOR = [204, 204, 204];

export function getPalette (name, numCategories) {
  const palette = cartoColors[name];
  let paletteIndex = numCategories;

  if (!palette) {
    throw new Error(`Palette ${name} is not found.`);
  }

  const palettesColorVariants = Object.keys(palette)
    .filter(p => p !== 'tags')
    .map(Number);

  const longestPaletteIndex = Math.max(...palettesColorVariants);
  const smallestPaletteIndex = Math.min(...palettesColorVariants);

  if (!Number.isInteger(numCategories) || numCategories > longestPaletteIndex) {
    paletteIndex = longestPaletteIndex;
  } else if (numCategories < smallestPaletteIndex) {
    paletteIndex = smallestPaletteIndex;
  }

  const colors = [ ...palette[paletteIndex] ];

  if (palette.tags && palette.tags.includes('qualitative')) {
    colors.pop();
  }

  return colors.map(c => hexToRgb(c));
}

function hexToRgb (hex) {
  // Evaluate #ABC
  let result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);

  if (result) {
    return [
      parseInt(result[1] + result[1], 16),
      parseInt(result[2] + result[2], 16),
      parseInt(result[3] + result[3], 16),
      255
    ];
  }

  // Evaluate #ABCD
  result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);

  if (result) {
    return [
      parseInt(result[1] + result[1], 16),
      parseInt(result[2] + result[2], 16),
      parseInt(result[3] + result[3], 16),
      parseInt(result[4] + result[4], 16)
    ];
  }

  // Evaluate #ABCDEF
  result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (result) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
  }

  // Evaluate #ABCDEFAF
  result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      parseInt(result[4], 16)
    ];
  }

  throw new Error(`Error parsing hexadecimal color: ${hex}`);
}

export function getQuantiles (stats, bins) {
  const minQuantile = parseInt(Object.keys(stats.quantiles[0]), 10);
  const maxQuantile = parseInt(Object.keys(stats.quantiles[stats.quantiles.length - 1]), 10);
  if (bins < minQuantile || bins > maxQuantile) {
    throw new Error(
      `Invalid bins value. It shoud be between ${minQuantile} and ${maxQuantile}`
    );
  }
  const quantiles = stats.quantiles.find(d => d.hasOwnProperty(bins));
  return [...quantiles[bins]];
}

export function formatNumber (value) {
  if (value !== undefined && value !== null) {
    if (!Number.isInteger(value)) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return value.toLocaleString();
  }
}

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function compare (a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
