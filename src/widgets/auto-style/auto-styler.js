var cdb = require('cartodb.js');
var CategoryColors = require('./category-colors');

var AutoStyler = cdb.core.Model.extend({
  initialize: function (dataviewModel, options) {
    this.options = options || {};
    this.styles = options && options.auto_style;
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors(this.styles);
    this.layer = this.dataviewModel.layer;
  }
});

AutoStyler.FILL_SELECTORS = ['marker-fill', 'polygon-fill', 'line-color'];
AutoStyler.OPACITY_SELECTORS = ['marker-fill-opacity', 'polygon-opacity', 'line-opacity'];

module.exports = AutoStyler;
