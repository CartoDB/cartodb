var BubbleLegendView = require('./bubble/legend-view');
var CategoryLegendView = require('./categories/legend-view');
var ChoroplethLegendView = require('./choropleth/legend-view');
var CustomLegendView = require('./custom/legend-view');
var CustomChoroplethLegendView = require('./custom-choropleth/legend-view');

var LEGEND_VIEW_CONSTRUCTORS = {
  bubble: BubbleLegendView,
  category: CategoryLegendView,
  choropleth: ChoroplethLegendView,
  custom_choropleth: CustomChoroplethLegendView,
  custom: CustomLegendView
};

var PLACEHOLDER_TEMPLATES = {
  bubble: require('./bubble/placeholder-template.tpl'),
  category: require('./categories/placeholder-template.tpl'),
  choropleth: require('./choropleth/placeholder-template.tpl')
};

module.exports = {
  createLegendView: function (legendModel) {
    var legendType = legendModel.get('type');
    var LegendViewClass = LEGEND_VIEW_CONSTRUCTORS[legendType];
    var placeholderTemplate = PLACEHOLDER_TEMPLATES[legendType];
    if (LegendViewClass) {
      return new LegendViewClass({
        model: legendModel,
        placeholderTemplate: placeholderTemplate
      });
    }

    throw new Error('Legends of type "' + legendType + '" are not supported');
  }
};
