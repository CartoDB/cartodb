import colorBinsStyle from './colorBinsStyle';
import colorCategoriesStyle from './colorCategoriesStyle';

const CATEGORY_PALETTES = {
  demographics: 'BrwnYl',
  environmental: 'BluGrn',
  derived: 'Teal',
  housing: 'Burg',
  human_mobility: 'RedOr',
  road_traffic: 'Sunset',
  financial: 'PurpOr',
  covid19: 'Peach',
  behavioral: 'TealGrn'
};

export function generateColorStyleProps ({ geomType, variable, categoryId, isGeography }) {
  const g = geomType;
  const v = variable && variable.type;
  const stats = variable;
  const props = { deck: {} };

  props.propId = variable && variable.attribute;

  if (g === 'Polygon' && isGeography) {
    props.deck.getFillColor = [234, 200, 100, 168];
    props.deck.getLineColor = [44, 44, 44, 60];
    props.deck.getLineWidth = 1;
  } else if (g === 'Polygon' && v === 'Number') {
    props.colorStyle = colorBinsStyle({
      breaks: { stats, method: 'quantiles', bins: 5 },
      colors: categoryIdPalette(categoryId)
    });
    props.deck.getFillColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineColor = [44, 44, 44, 60];
    props.deck.getLineWidth = 1;
  } else if (g === 'Polygon' && v === 'String') {
    props.colorStyle = colorCategoriesStyle({
      categories: { stats, top: 10 },
      colors: 'Prism'
    });
    props.deck.getFillColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineColor = [44, 44, 44, 60];
    props.deck.getLineWidth = 1;
  } else if (g === 'LineString' && isGeography) {
    props.deck.getLineColor = [234, 200, 100, 255];
    props.deck.getLineWidth = 2;
  } else if (g === 'LineString' && v === 'Number') {
    props.colorStyle = colorBinsStyle({
      breaks: { stats, method: 'quantiles', bins: 5 },
      colors: categoryIdPalette(categoryId)
    });
    props.deck.getLineColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineWidth = 2;
  } else if (g === 'LineString' && v === 'String') {
    props.colorStyle = colorCategoriesStyle({
      categories: { stats, top: 10 },
      colors: 'Prism'
    });
    props.deck.getLineColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineWidth = 2;
  } else if (g === 'Point' && isGeography) {
    props.deck.getFillColor = [234, 200, 100, 255];
    props.deck.getLineColor = [44, 44, 44, 255];
    props.deck.getLineWidth = 1;
    props.deck.getRadius = 4;
  } else if (g === 'Point' && v === 'Number') {
    props.colorStyle = colorBinsStyle({
      breaks: { stats, method: 'quantiles', bins: 5 },
      colors: categoryIdPalette(categoryId)
    });
    props.deck.getFillColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineColor = [100, 100, 100, 255];
    props.deck.getLineWidth = 1;
    props.deck.getRadius = 4;
  } else if (g === 'Point' && v === 'String') {
    props.colorStyle = colorCategoriesStyle({
      categories: { stats, top: 10 },
      colors: 'Bold'
    });
    props.deck.getFillColor = (d) => props.colorStyle(d.properties[props.propId]);
    props.deck.getLineColor = [100, 100, 100, 255];
    props.deck.getLineWidth = 1;
    props.deck.getRadius = 4;
  }

  return props;
}

export function resetColorStyleProps () {
  return {
    propId: undefined,
    colorStyle: undefined,
    deck: {
      getFillColor: undefined,
      getLineColor: undefined,
      getLineWidth: undefined,
      getRadius: undefined
    }
  };
}

function categoryIdPalette (categoryId) {
  return CATEGORY_PALETTES[categoryId] || 'OrYel';
}
