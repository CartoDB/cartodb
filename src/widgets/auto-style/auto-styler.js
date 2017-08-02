var cdb = require('cartodb.js');
var StyleUtils = require('./style-utils');
var CategoryColors = require('./category-colors');
var getValue = require('../../util/get-object-value');

var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel, options) {
    this.options = options || {};
    this.styles = options && options.auto_style;
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors(this.styles);
    this.layer = this.dataviewModel.layer;
  },

  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;

    AutoStyler.FILL_SELECTORS.forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this._getFillColor(item));
    }.bind(this));

    AutoStyler.OPACITY_SELECTORS.forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this._getOpacity());
    }.bind(this));

    return StyleUtils.replaceWrongSpaceChar(style);
  },

  _getColor: function () {
    return getValue(this.styles, 'definition.color');
  },

  _getOpacity: function () {
    return getValue(this.styles, 'definition.color.opacity');
  }
});

AutoStyler.FILL_SELECTORS = ['marker-fill', 'polygon-fill', 'line-color'];
AutoStyler.OPACITY_SELECTORS = ['marker-fill-opacity', 'polygon-opacity', 'line-opacity'];

module.exports = AutoStyler;
