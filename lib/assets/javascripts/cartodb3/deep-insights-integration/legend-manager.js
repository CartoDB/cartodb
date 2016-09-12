var LegendFactory = require('../editor/layers/layer-content-views/legend/legend-factory');

var onChange = function (layerDefModel) {
  var fill = layerDefModel.styleModel.get('fill');
  var color = fill.color;
  var size = fill.size;

  if (size.attribute !== undefined) {
    LegendFactory.createLegend(layerDefModel, 'bubble');
  }

  if (color.attribute !== undefined) {
    if (color.attribute_type === 'number') {
      LegendFactory.createLegend(layerDefModel, 'choropleth');
    }

    if (color.attribute_type === 'string') {
      LegendFactory.createLegend(layerDefModel, 'category');
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
