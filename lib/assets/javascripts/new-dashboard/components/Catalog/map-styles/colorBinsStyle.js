import { range } from 'd3-array';
import { scaleThreshold } from 'd3-scale';
import { getQuantiles, getPalette, NULL_COLOR } from './utils';

const BINS = 5;

export default function colorBinsStyle ({ breaks, colors, nullColor = NULL_COLOR }) {
  let domain;
  if (Array.isArray(breaks)) {
    domain = breaks;
  } else {
    const { stats, method, bins = BINS } = breaks;

    if (method === 'quantiles') {
      const range = getQuantiles(stats, bins);
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
