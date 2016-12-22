var _ = require('underscore');
var LegendColorHelper = require('../editor/layers/layer-content-views/legend/form/legend-color-helper');

var legends;

var LEGENDS_METADATA = ['bubble', 'category', 'choropleth', 'custom', 'custom_choropleth'];
var LEGENDS_COLOR = ['category', 'choropleth'];

function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function updateBubbleColor (layerId, style) {
  var legendsLayer = legends[layerId];
  var bubble = legendsLayer['bubble'];
  var color;
  if (bubble != null) {
    color = style.definition != null ? getColorFromAutoStyle(style) : getColorFromLayer(style);
    bubble.set({fillColor: color.fixed});
  }
}

function getColorFromAutoStyle (style) {
  var cartocss = style.cartocss;
  var geom = getGeometryFromCss(cartocss);
  var color = style.definition[geom].color;
  return LegendColorHelper.getBubbles(color).color;
}

function getColorFromLayer (style) {
  var color = style.properties.fill.color;
  return LegendColorHelper.getBubbles(color).color;
}

function getGeometryFromCss (cartocss) {
  var geom;
  ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
    if (cartocss.search(getAttrRegex(item, false)) >= 0) {
      geom = item.substring(0, item.indexOf('-'));
    }
  });
  return geom === 'marker' ? 'point' : geom;
}

var LegendManager = {
  trackLegends: function (layers) {
    legends = {};

    _.each(layers.models, function (layer) {
      var legendsLayer;
      var o = {};
      if (layer.legends != null) {
        legendsLayer = layer.legends;
        _.each(LEGENDS_METADATA, function (legend) {
          var m = legendsLayer[legend];
          if (m.get('visible') === true) {
            o[legend] = m;
          }
        });
        legends[layer.id] = o;
      }
    });
  },

  getLegends: function () {
    return legends;
  },

  updateLegends: function (layerId, style) {
    var legendsLayer = legends[layerId];
    updateBubbleColor(layerId, style);
    _.each(LEGENDS_COLOR, function (legend) {
      var m = legendsLayer[legend];
      m && m.set({visible: false});
    });
  },

  resetLegends: function (layerId, style) {
    var legendsLayer = legends[layerId];
    updateBubbleColor(layerId, style);
    _.each(legendsLayer, function (legend) {
      legend.set({visible: true});
    });
  }
};

module.exports = LegendManager;
