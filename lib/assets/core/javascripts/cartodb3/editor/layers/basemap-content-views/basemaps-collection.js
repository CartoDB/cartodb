var Backbone = require('backbone');
var BasemapModel = require('./basemap-model');
var _ = require('underscore');

/*
 *  Basemap collection, extends Mosaic collection
 */

module.exports = Backbone.Collection.extend({

  model: BasemapModel,

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onSelectedChange: function (changedModel, isSelected) {
    if (isSelected) {
      this.each(function (m) {
        if (m.cid !== changedModel.cid && m.get('selected')) {
          m.set('selected', false);
        }
      });
    }
  },

  findByCategory: function (category) {
    return this.where({ category: category });
  },

  getDefaultCategory: function () {
    var defaultCategory = this.findWhere({ default: true });
    defaultCategory = defaultCategory || this.first();

    return defaultCategory.get('category');
  },

  getCategories: function () {
    var categories = this.chain()
      .map(function (model) { return model.get('category'); })
      .concat('Custom')
      .concat('NASA')
      .concat('TileJSON')
      .concat('Mapbox')
      .concat('WMS')
      .uniq()
      .value();

    return categories;
  },

  getSelected: function () {
    return this.findWhere({ selected: true });
  },

  updateSelected: function (value) {
    var newSelected = this.getByValue(value);
    newSelected.set({ selected: true });
  },

  updateCategory: function (value, category) {
    var newCategory = this.getByValue(value);
    newCategory.set({ category: category });
  },

  getByValue: function (value) {
    return _.first(this.where({ val: value }));
  },

  getThumbnailImage: function (urlTemplate, subdomains) {
    return this._lowerXYZ(urlTemplate, subdomains);
  }

});
