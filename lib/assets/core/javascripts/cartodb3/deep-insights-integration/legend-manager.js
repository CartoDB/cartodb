var _ = require('underscore');
var LegendFactory = require('../editor/layers/layer-content-views/legend/legend-factory');

var onChange = function (layerDefModel) {
  var styleModel = layerDefModel.styleModel;
  var autoStyle = layerDefModel.get('autoStyle');
  var isAutoStyleApplied = autoStyle != null && autoStyle !== false;
  var fill;
  var stroke;
  var color;
  var size;

  function createColorLegend (layerDefModel, color) {
    var styleModel = layerDefModel.styleModel;

    if (styleModel.get('type') === 'animation') {
      LegendFactory.removeLegend(layerDefModel, 'choropleth', function () {
        LegendFactory.removeLegend(layerDefModel, 'custom_choropleth', function () {
          LegendFactory.createLegend(layerDefModel, 'category', {title: color.attribute});
        });
      });
    } else if (styleModel.get('type') === 'heatmap') {
      LegendFactory.removeLegend(layerDefModel, 'category', function () {
        LegendFactory.removeLegend(layerDefModel, 'choropleth', function () {
          LegendFactory.createLegend(layerDefModel, 'custom_choropleth', {title: _t('editor.legend.pixel-title')});
        });
      });
    } else {
      if ((color.attribute_type && color.attribute_type === 'string') || color.quantification === 'category') {
        LegendFactory.removeLegend(layerDefModel, 'choropleth', function () {
          LegendFactory.removeLegend(layerDefModel, 'custom_choropleth', function () {
            if (!isAutoStyleApplied) {
              LegendFactory.createLegend(layerDefModel, 'category', {title: color.attribute});
            } else {
              LegendFactory.removeLegend(layerDefModel, 'category');
            }
          });
        });
      } else {
        LegendFactory.removeLegend(layerDefModel, 'category', function () {
          LegendFactory.removeLegend(layerDefModel, 'custom_choropleth', function () {
            if (!isAutoStyleApplied) {
              LegendFactory.createLegend(layerDefModel, 'choropleth', {title: color.attribute});
            } else {
              LegendFactory.removeLegend(layerDefModel, 'choropleth');
            }
          });
        });
      }
    }
  }

  if (!styleModel) return;

  fill = styleModel.get('fill');
  stroke = styleModel.get('stroke');

  if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return;

  color = fill && fill.color || stroke && stroke.color;
  size = fill && fill.size || stroke && stroke.size;

  if (LegendFactory.isEnabledType('size')) {
    if (size && size.attribute !== undefined) {
      LegendFactory.createLegend(layerDefModel, 'bubble', {title: size.attribute});
    } else {
      LegendFactory.removeLegend(layerDefModel, 'bubble');
    }
  }

  if (LegendFactory.isEnabledType('color')) {
    if (color && color.attribute !== undefined) {
      var hasCustomLegend = LegendFactory.find(layerDefModel, 'custom');

      if (!hasCustomLegend) {
        createColorLegend(layerDefModel, color);
      }
    } else {
      LegendFactory.removeLegend(layerDefModel, 'category');
      LegendFactory.removeLegend(layerDefModel, 'choropleth');
      LegendFactory.removeLegend(layerDefModel, 'custom_choropleth');
    }
  }
};

module.exports = {
  track: function (layerDefModel) {
    var onStyleChange = function () {
      onChange(layerDefModel);
    };

    var styleModel = layerDefModel.styleModel;

    layerDefModel.on('change:cartocss', onChange);
    styleModel && styleModel.on('style:update', onStyleChange);

    layerDefModel.on('destroy', function () {
      layerDefModel.off('change:cartocss', onChange);
      styleModel && styleModel.off('style:update', onStyleChange);
    });
  }
};
