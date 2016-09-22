var LegendFactory = require('../editor/layers/layer-content-views/legend/legend-factory');

var onChange = function (layerDefModel) {
  var styleModel = layerDefModel.styleModel;
  var canSuggestLegends = !LegendFactory.hasMigratedLegend(layerDefModel);
  var fill;
  var color;
  var size;

  function createColorLegend (color) {
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

  // LegendFactory.removeAllLegend(layerDefModel);

  fill = styleModel.get('fill');

  if (!fill) return;

  color = fill.color;
  size = fill.size;

  if (size && size.attribute !== undefined) {
    LegendFactory.createLegend(layerDefModel, 'bubble');
  } else {
    LegendFactory.removeLegend(layerDefModel, 'bubble');
  }

  if (color && color.attribute !== undefined) {
    LegendFactory.removeLegend(layerDefModel, 'custom', createColorLegend.bind(null, color));
  } else {
    LegendFactory.removeLegend(layerDefModel, 'category');
    LegendFactory.removeLegend(layerDefModel, 'choropleth');
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
