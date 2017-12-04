// Override geometryType for aggregated styles

var AggregatedFactory = {
  simple: {
    point: 'point',
    line: 'line',
    polygon: 'polygon'
  },
  hexabins: {
    point: 'polygon',
    line: null,
    polygon: null
  },
  squares: {
    point: 'polygon',
    line: null,
    polygon: null
  },
  regions: {
    point: 'polygon',
    line: null,
    polygon: null
  }
};

module.exports = {
  needsOverwrite: function (styleType, geometryType) {
    return !!AggregatedFactory[styleType];
  },

  getGeometryByStyleType: function (styleType, geometryType) {
    if (this.needsOverwrite(styleType)) {
      return AggregatedFactory[styleType][geometryType];
    }

    return geometryType;
  }
};
