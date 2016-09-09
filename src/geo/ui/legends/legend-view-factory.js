var BubbleLegendView = require('./bubble-legend-view');
var CategoryLegendView = require('./category-legend-view');
var ChoroplethLegendView = require('./choropleth-legend-view');
var CustomLegendView = require('./custom-legend-view');
var HTMLLegendView = require('./html-legend-view');

var LEGEND_VIEW_CONSTRUCTORS = {
  bubble: BubbleLegendView,
  category: CategoryLegendView,
  choropleth: ChoroplethLegendView,
  custom: CustomLegendView,
  html: HTMLLegendView
};

module.exports = {
  createLegendView: function (legendModel) {
    var legendType = legendModel.get('type');
    var LegendViewClass = LEGEND_VIEW_CONSTRUCTORS[legendType];
    if (LegendViewClass) {
      return new LegendViewClass({
        model: legendModel
      });
    }

    throw new Error('Legends of type "' + legendType + '" are not supported');
  }
};
