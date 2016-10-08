var _ = require('underscore');
var LegendFactory = require('../editor/layers/layer-content-views/legend/legend-factory');

var onChange = function (layerDefModel) {
  var styleModel = layerDefModel.styleModel;
  var canSuggestLegends = !LegendFactory.hasMigratedLegend(layerDefModel);
  var fill;
  var stroke;
  var color;
  var size;

  function createColorLegend (layerDefModel, color) {
    if (color.attribute_type && color.attribute_type === 'string') {
      LegendFactory.createLegend(layerDefModel, 'category');
      LegendFactory.removeLegend(layerDefModel, 'choropleth');
    } else {
      LegendFactory.createLegend(layerDefModel, 'choropleth');
      LegendFactory.removeLegend(layerDefModel, 'category');
    }
  }

  if (!styleModel) return;
  if (!canSuggestLegends) return;

  fill = styleModel.get('fill');
  stroke = styleModel.get('stroke');

  if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return;

  color = fill && fill.color || stroke && stroke.color;
  size = fill && fill.size || stroke && stroke.size;

  if (LegendFactory.isEnabledType('size')) {
    if (size && size.attribute !== undefined) {
      LegendFactory.createLegend(layerDefModel, 'bubble');
    } else {
      LegendFactory.removeLegend(layerDefModel, 'bubble');
    }
  }

  if (LegendFactory.isEnabledType('color')) {
    if (color && color.attribute !== undefined) {
      LegendFactory.removeLegend(layerDefModel, 'custom', createColorLegend.bind(null, layerDefModel, color));
    } else {
      LegendFactory.removeLegend(layerDefModel, 'category');
      LegendFactory.removeLegend(layerDefModel, 'choropleth');
    }
  }
};

module.exports = {
  track: function (layerDefModel) {
    layerDefModel.on('change:cartocss', onChange);

    layerDefModel.on('destroy', function () {
      layerDefModel.off('change:cartocss', onChange);
    });
  }
};
