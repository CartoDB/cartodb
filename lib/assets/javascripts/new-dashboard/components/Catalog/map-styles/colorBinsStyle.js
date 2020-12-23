import { range } from 'd3-array';
import { scaleThreshold } from 'd3-scale';
import { getPalette, NULL_COLOR } from './utils';

const N_BINS = 5;

export default function colorBinsStyle ({ breaks, colors, nullColor = NULL_COLOR }) {
  let domain;
  if (Array.isArray(breaks)) {
    domain = breaks;
  } else {
    const { stats, method, bins = N_BINS } = breaks;

    if (method === 'quantiles') {
      const minQuantile = parseInt(Object.keys(stats.quantiles[0]), 10);
      const maxQuantile = parseInt(Object.keys(stats.quantiles[stats.quantiles.length - 1]), 10);
      if (bins < minQuantile || bins > maxQuantile) {
        throw new Error(
          `Invalid bins value. It shoud be between ${minQuantile} and ${maxQuantile}`
        );
      }
      const quantiles = stats.quantiles.find(d => d.hasOwnProperty(bins));
      const range = [...quantiles[bins]];
      range.push(stats.max);
      domain = [...new Set(range)];
    } else {
      const { min, max } = stats;
      const step = (max - min) / bins;
      domain = [...new Set(range(min + step, max, step))];
    }
  }

  const palette = typeof colors === 'string' ? getPalette(colors, domain.length) : colors;

  const color = scaleThreshold()
    .domain(domain)
    .range(palette);

  return value => {
    // Remove some epsilon to make sure we are below the breaks
    // Fixes the case for domains with less than 3 elements.
    const FACTOR = 0.99999;
    return Number.isFinite(value) ? color(value * FACTOR) : nullColor;
  };
}
