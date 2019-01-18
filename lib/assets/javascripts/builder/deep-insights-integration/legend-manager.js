var _ = require('underscore');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var LegendColorHelper = require('builder/editor/layers/layer-content-views/legend/form/legend-color-helper');
var LegendTypes = require('builder/editor/layers/layer-content-views/legend/legend-types');

var StyleHelper = require('builder/helpers/style');
var DEFAULT_BUBBLES_COLOR = '#999999';

function _createLegendForAnimation (layerDefModel, color) {
  LegendFactory.removeLegend(layerDefModel, LegendTypes.CATEGORY, function () {
    LegendFactory.removeLegend(layerDefModel, LegendTypes.CHOROPLETH, function () {
      LegendFactory.removeLegend(layerDefModel, LegendTypes.CUSTOM_CHOROPLETH, function () {
        var items = StyleHelper.getStyleCategories(layerDefModel.styleModel);
        LegendFactory.createLegend(layerDefModel, LegendTypes.TORQUE, {
          title: color.attribute,
          items: items
        });
      });
    });
  });
}

function _createLegendForHeatmap (layerDefModel) {
  LegendFactory.removeLegend(layerDefModel, LegendTypes.CATEGORY, function () {
    LegendFactory.removeLegend(layerDefModel, LegendTypes.TORQUE, function () {
      LegendFactory.removeLegend(layerDefModel, LegendTypes.CHOROPLETH, function () {
        var colors = StyleHelper.getHeatmapColors(layerDefModel);
        LegendFactory.createLegend(layerDefModel, LegendTypes.CUSTOM_CHOROPLETH, {
          title: _t('editor.legend.pixel-title'),
          colors: colors
        });
      });
    });
  });
}

function _createCategoryLegend (layerDefModel, color) {
  LegendFactory.removeLegend(layerDefModel, LegendTypes.CHOROPLETH, function () {
    LegendFactory.removeLegend(layerDefModel, LegendTypes.CUSTOM_CHOROPLETH, function () {
      if (layerDefModel.isAutoStyleApplied()) {
        LegendFactory.removeLegend(layerDefModel, LegendTypes.CATEGORY);
      } else {
        LegendFactory.createLegend(layerDefModel, LegendTypes.CATEGORY, { title: color.attribute });
      }
    });
  });
}

function _createChoroplethLegend (layerDefModel, color) {
  LegendFactory.removeLegend(layerDefModel, LegendTypes.CATEGORY, function () {
    LegendFactory.removeLegend(layerDefModel, LegendTypes.TORQUE, function () {
      LegendFactory.removeLegend(layerDefModel, LegendTypes.CUSTOM_CHOROPLETH, function () {
        if (layerDefModel.isAutoStyleApplied()) {
          LegendFactory.removeLegend(layerDefModel, LegendTypes.CHOROPLETH);
        } else {
          LegendFactory.createLegend(layerDefModel, LegendTypes.CHOROPLETH, { title: color.attribute });
        }
      });
    });
  });
}

function _createColorLegend (layerDefModel, color) {
  var styleModel = layerDefModel.styleModel;

  if (styleModel.isAnimation()) {
    _createLegendForAnimation(layerDefModel, color);
  } else if (styleModel.isHeatmap()) {
    _createLegendForHeatmap(layerDefModel);
  } else {
    var usesCategory = (color && color.quantification === 'category');
    var attributeTypeIsString = (color.attribute_type && color.attribute_type === 'string');
    var attributeTypeIsBoolean = (color.attribute_type && color.attribute_type === 'boolean');

    if (usesCategory || attributeTypeIsString || attributeTypeIsBoolean) {
      _createCategoryLegend(layerDefModel, color);
    } else {
      _createChoroplethLegend(layerDefModel, color);
    }
  }
}

function _updateSizeLegend (layerDefModel, size, color) {
  if (size && size.attribute !== undefined) {
    var attrs = { title: size.attribute };

    if (!layerDefModel.isAutoStyleApplied()) {
      // Do not apply the fill color of an autostyle ramp
      attrs.fillColor = color && (color.fixed || color.range)
        ? LegendColorHelper.getBubbles(color).color.fixed
        : DEFAULT_BUBBLES_COLOR;
    }

    var hasBubbleLegend = LegendFactory.find(layerDefModel, LegendTypes.BUBBLE);
    if (hasBubbleLegend) {
      LegendFactory.createLegend(layerDefModel, LegendTypes.BUBBLE, attrs);
    }
  } else {
    LegendFactory.removeLegend(layerDefModel, LegendTypes.BUBBLE);
  }
}

function _updateColorLegend (layerDefModel, color) {
  var colorLegendTypes = [LegendTypes.CATEGORY, LegendTypes.TORQUE, LegendTypes.CHOROPLETH, LegendTypes.CUSTOM_CHOROPLETH];

  if (color && color.attribute !== undefined) {
    var hasSomeLegend = [];

    _.each(colorLegendTypes, function (legendType) {
      var hasLegend = LegendFactory.find(layerDefModel, legendType);
      if (hasLegend) {
        hasSomeLegend.push(hasLegend);
      }
    });

    var hasCustomLegend = LegendFactory.find(layerDefModel, LegendTypes.CUSTOM);
    if (!hasCustomLegend && hasSomeLegend.length) {
      _createColorLegend(layerDefModel, color);
    }
  } else {
    _.each(colorLegendTypes, function (legendType) {
      LegendFactory.removeLegend(layerDefModel, legendType);
    });
  }
}

var onChange = function (layerDefModel) {
  var color = StyleHelper.getColor(layerDefModel.styleModel);
  var size = StyleHelper.getSize(layerDefModel.styleModel);

  if (color == null && size == null) return;

  if (LegendFactory.isEnabledType('size')) {
    _updateSizeLegend(layerDefModel, size, color);
  }

  if (LegendFactory.isEnabledType('color')) {
    _updateColorLegend(layerDefModel, color);
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

        if (!hasChangedCartocss && styleModel.isAnimation()) {
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
