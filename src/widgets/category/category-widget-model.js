var WidgetModel = require('../widget-model');
var CategoryColors = require('./category-colors');
var LockedCategoriesCollection = require('./locked-categories-collection');

/**
 * Model for a category widget
 */
module.exports = WidgetModel.extend({

  defaults: {
    title: '',
    search: false,
    locked: false,
    isColorsApplied: false
  },

  initialize: function () {
    WidgetModel.prototype.initialize.apply(this, arguments);
    this.colors = new CategoryColors();
    this.lockedCategories = new LockedCategoriesCollection();

    this.dataviewModel.on('change:allCategoryNames', this._onDataviewAllCategoryNamesChange, this);
    this.dataviewModel.on('change:searchData', this._onDataviewChangeSearchData, this);

    this.bind('change:locked', this._onLockedChange, this);
  },

  setupSearch: function () {
    this.dataviewModel.setupSearch();
    this.lockedCategories.addItems(this._acceptedCategories().toJSON());
    this.toggleSearch();
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

  cleanSearch: function () {
    this.dataviewModel.cleanSearch();
    this.lockedCategories.reset([]);
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

  isLocked: function () {
    return this.get('locked');
  },

  canBeLocked: function () {
    return this.isLocked() || this._acceptedCategories().size() > 0;
  },

  canApplyLocked: function () {
    if (this._acceptedCategories().size() !== this.lockedCategories.size()) {
      return true;
    }

    return this._acceptedCategories().any(function (m) {
      return !this.lockedCategories.isItemLocked(m.get('name'));
    }, this);
  },

  applyLocked: function () {
    var currentLocked = this.lockedCategories.getItemsName();
    if (!currentLocked.length) {
      this.unlockCategories();
      return false;
    }

    this.set('locked', true);

    var f = this.dataviewModel.filter;
    f.cleanFilter(false);
    f.accept(currentLocked);
    f.applyFilter();

    this.cleanSearch();
  },

  lockCategories: function () {
    this.set('locked', true);
    this.dataviewModel.forceFetch();
  },

  unlockCategories: function () {
    this.set('locked', false);
    this.dataviewModel.filter.acceptAll();
  },

  _onDataviewAllCategoryNamesChange: function (m, names) {
    this.colors.updateData(names);
    if (this.isColorApplied()) {
      this.applyColors();
    }
  },

  _onDataviewChangeSearchData: function () {
    // Update selected state for each search result item based on locked categories
    this.dataviewModel.getSearchResult().each(function (m) {
      var selected = this.lockedCategories.isItemLocked(m.get('name'));
      m.set('selected', selected);
    }, this);
  },

  _onLockedChange: function (m, isLocked) {
    if (isLocked) {
      this.dataviewModel.disableFilter();
    } else {
      this.dataviewModel.enableFilter();
    }
  },

  _acceptedCategories: function () {
    return this.dataviewModel.filter.acceptedCategories;
  }

});
