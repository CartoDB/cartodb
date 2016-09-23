var LegendFactory = require('../editor/layers/layer-content-views/legend/legend-factory');

var onChange = function (layerDefModel) {
  var styleModel = layerDefModel.styleModel;
  var canSuggestLegends = !LegendFactory.hasMigratedLegend(layerDefModel);
  var fill;
  var color;
  var size;

  if (!styleModel) return;
  if (!canSuggestLegends) return;

  LegendFactory.removeAllLegend(layerDefModel);

  fill = styleModel.get('fill');

  if (!fill) return;

  color = fill.color;
  size = fill.size;

  if (size && size.attribute !== undefined) {
    LegendFactory.createLegend(layerDefModel, 'bubble');
  }

  if (color && color.attribute !== undefined) {
    if (color.attribute_type && color.attribute_type === 'string') {
      LegendFactory.createLegend(layerDefModel, 'category');
    } else {
      LegendFactory.createLegend(layerDefModel, 'choropleth');
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
