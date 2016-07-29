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
    this.bind('add', this._onAdd, this);
    this.bind('change:selected', this._onSelectedChange, this);
  },

  _onAdd: function (mdl) {
    this.updateSelected(mdl.getValue());
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

  findByCategory: function (cat) {
    return this.where({ category: cat });
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
      // .concat('Mapbox')
      .uniq()
      .value();

    return categories;
  },

  getSelected: function () {
    return _.first(this.where({ selected: true }));
  },

  updateSelected: function (value) {
    var newSelected = this.getByValue(value);
    newSelected.set({ selected: true });
  },

  getByValue: function (value) {
    return _.first(this.where({ val: value }));
  }

});
