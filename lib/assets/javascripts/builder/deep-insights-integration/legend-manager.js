var _ = require('underscore');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var LegendColorHelper = require('builder/editor/layers/layer-content-views/legend/form/legend-color-helper');
var StyleHelper = require('builder/helpers/style');
var DEFAULT_BUBBLES_COLOR = '#999999';

var onChange = function (layerDefModel) {
  var styleModel = layerDefModel.styleModel;
  var autoStyle = layerDefModel.get('autoStyle');
  var isAutoStyleApplied = autoStyle != null && autoStyle !== false;
  var color;
  var size;

  function createColorLegend (layerDefModel, color) {
    var styleModel = layerDefModel.styleModel;

    if (styleModel.get('type') === 'animation') {
      LegendFactory.removeLegend(layerDefModel, 'category', function () {
        LegendFactory.removeLegend(layerDefModel, 'choropleth', function () {
          LegendFactory.removeLegend(layerDefModel, 'custom_choropleth', function () {
            var items = StyleHelper.getStyleCategories(styleModel);
            LegendFactory.createLegend(layerDefModel, 'torque', {title: color.attribute, items: items});
          });
        });
      });
    } else if (styleModel.get('type') === 'heatmap') {
      LegendFactory.removeLegend(layerDefModel, 'category', function () {
        LegendFactory.removeLegend(layerDefModel, 'torque', function () {
          LegendFactory.removeLegend(layerDefModel, 'choropleth', function () {
            var colors = StyleHelper.getColorsFromRange(styleModel);
            LegendFactory.createLegend(layerDefModel, 'custom_choropleth', {
              title: _t('editor.legend.pixel-title'),
              colors: colors
            });
          });
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
          LegendFactory.removeLegend(layerDefModel, 'torque', function () {
            LegendFactory.removeLegend(layerDefModel, 'custom_choropleth', function () {
              if (!isAutoStyleApplied) {
                LegendFactory.createLegend(layerDefModel, 'choropleth', {title: color.attribute});
              } else {
                LegendFactory.removeLegend(layerDefModel, 'choropleth');
              }
            });
          });
        });
      }
    }
  }

  color = StyleHelper.getColor(styleModel);
  size = StyleHelper.getSize(styleModel);

  if (color == null && size == null) return;

  if (LegendFactory.isEnabledType('size')) {
    if (size && size.attribute !== undefined) {
      var attrs = { title: size.attribute };

      if (!isAutoStyleApplied) {
        // Do not apply the fill color of an autostyle ramp
        attrs.fillColor = color && (color.fixed || color.range)
          ? LegendColorHelper.getBubbles(color).color.fixed
          : DEFAULT_BUBBLES_COLOR;
      }

      var hasBubbleLegend = LegendFactory.find(layerDefModel, 'bubble');
      if (hasBubbleLegend) {
        LegendFactory.createLegend(layerDefModel, 'bubble', attrs);
      }
    } else {
      LegendFactory.removeLegend(layerDefModel, 'bubble');
    }
  }

  if (LegendFactory.isEnabledType('color')) {
    var legendTypes = ['category', 'torque', 'choropleth', 'custom_choropleth'];

    if (color && color.attribute !== undefined) {
      var hasCustomLegend = LegendFactory.find(layerDefModel, 'custom');
      var hasSomeLegend = [];

      _.each(legendTypes, function (legendType) {
        var hasLegend = LegendFactory.find(layerDefModel, legendType);
        if (hasLegend) {
          hasSomeLegend.push(hasLegend);
        }
      });

      if (!hasCustomLegend && hasSomeLegend.length) {
        createColorLegend(layerDefModel, color);
      }
    } else {
      _.each(legendTypes, function (legendType) {
        LegendFactory.removeLegend(layerDefModel, legendType);
      });
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
    if (styleModel) {
      styleModel.on('style:update', onStyleChange);

      // For torque legends, for agreggations with the same range, there is no change on the cartocss
      // so we need to force the onChange for these.
      styleModel.on('change', function () {
        var hasChangedCartocss = layerDefModel.hasChanged('cartocss');
        var type = styleModel.get('type');

        if (!hasChangedCartocss && type === 'animation') {
          onChange(layerDefModel);
        }
      });
    }

    layerDefModel.on('destroy', function () {
      layerDefModel.off('change:cartocss', onChange);
      styleModel && styleModel.off('style:update', onStyleChange);
    });
  }
};
