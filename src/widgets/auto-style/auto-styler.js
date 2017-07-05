var cdb = require('cartodb.js');
var CategoryColors = require('./category-colors');

module.exports = cdb.core.Model.extend({
  initialize: function (dataviewModel, options) {
    this.options = options || {};
    this.styles = options && options.auto_style;
    this.dataviewModel = dataviewModel;
    this.colors = new CategoryColors(this.styles);
    this.layer = this.dataviewModel.layer;
  }
});
