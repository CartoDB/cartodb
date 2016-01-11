var WidgetModel = require('../widget-model');
var CategoryColors = require('./category-colors');

/**
 * Model for a category widget
 */
module.exports = WidgetModel.extend({

  defaults: {
    title: '',
    search: false,
    isColorsApplied: false
  },

  initialize: function () {
    WidgetModel.prototype.initialize.apply(this, arguments);
    this.colors = new CategoryColors();
    this.dataviewModel.bind('change:allCategoryNames', this._onChangeDataviewAllCategoryNames, this);
  },

  toggleSearch: function () {
    this.set('search', !this.get('search'));
  },

  enableSearch: function () {
    this.set('search', true);
  },

  disableSearch: function () {
    this.set('search', false);
  },

  isSearchEnabled: function () {
    return this.get('search');
  },

  applyColors: function () {
    this.set('isColorsApplied', true);
  },

  cancelColors: function () {
    this.set('isColorsApplied', false);
  },

  isColorApplied: function () {
    return this.get('isColorsApplied');
  },

  _onChangeDataviewAllCategoryNames: function (m, names) {
    this.colors.updateData(names);
    if (this.isColorApplied()) {
      this.applyColors();
    }
  }

});
