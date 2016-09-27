var ADAPTERS = {
  bubble: require('./rule-to-bubble-legend-adapter'),
  choropleth: require('./rule-to-choropleth-legend-adapter'),
  category: require('./rule-to-category-legend-adapter')
};

module.exports = {
  getAdapterForLegend: function (legendModel) {
    return ADAPTERS[legendModel.get('type')];
  }
};
