import { getPalette, NULL_COLOR } from './utils';

const OTHERS_COLOR = [165, 170, 153];
const TOP = 10;

export default function colorCategoriesStyle ({
  categories,
  colors,
  nullColor = NULL_COLOR,
  othersColor = OTHERS_COLOR
}) {
  let categoryList;
  const colorsByCategory = {};

  if (Array.isArray(categories)) {
    categoryList = categories;
  } else {
    const { stats, top = TOP } = categories;
    categoryList = stats.categories.map(c => c.category).slice(0, top);
  }

  const palette = typeof colors === 'string' ? getPalette(colors, categoryList.length) : colors;

  for (const [i, c] of categoryList.entries()) {
    colorsByCategory[c] = palette[i];
  }

  return value => {
    return Number.isFinite(value) || typeof value === 'string'
      ? colorsByCategory[value] || othersColor
      : nullColor;
  };
}
