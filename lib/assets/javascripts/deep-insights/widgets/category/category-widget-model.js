var _ = require('underscore');
var WidgetModel = require('../widget-model');
var LockedCategoriesCollection = require('./locked-categories-collection');

/**
 * Model for a category widget
 */
module.exports = WidgetModel.extend({

  defaults: _.extend({
    type: 'category',
    search: false,
    locked: false
  },
  WidgetModel.prototype.defaults
  ),

  defaultState: _.extend({
    acceptedCategories: [],
    locked: false,
    autoStyle: false
  },
  WidgetModel.prototype.defaultState
  ),

  initialize: function () {
    WidgetModel.prototype.initialize.apply(this, arguments);
    this.lockedCategories = new LockedCategoriesCollection();

    this.listenTo(this.dataviewModel, 'change:allCategoryNames', this._onDataviewAllCategoryNamesChange);

    this.on('change:locked', this._onLockedChange, this);
    this.on('change:collapsed', this._onCollapsedChange, this);

    if (this.isAutoStyleEnabled()) {
      this.on('change:style', this._updateAutoStyle, this);
    }

    this.dataviewModel.filter.on('change', function () {
      this.set('acceptedCategories', this._acceptedCategories().pluck('name'));
    }, this);
    this.dataviewModel.once('change:allCategoryNames', function () {
      if (this.get('autoStyle')) {
        this.autoStyle();
      }
    }, this);
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

  autoStyle: function () {
    // NOTE: maybe not pre-assing colors to categories?
    if (this.autoStyler) {
      this.autoStyler.colors.updateData(this.dataviewModel.get('allCategoryNames'));
    }

    WidgetModel.prototype.autoStyle.call(this);
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
    this.dataviewModel.fetch();
  },

  unlockCategories: function () {
    this.set('locked', false);
    this.dataviewModel.filter.acceptAll();
  },

  _onDataviewAllCategoryNamesChange: function (m, names) {
    if (this.isAutoStyleEnabled()) {
      if (!this.isAutoStyle()) {
        this.autoStyler.colors.updateData(names);
      }
    }
  },

  _onLockedChange: function (m, isLocked) {
    if (isLocked) {
      this.dataviewModel.enableFilter();
    } else {
      this.dataviewModel.disableFilter();
    }
  },

  _acceptedCategories: function () {
    return this.dataviewModel.filter.acceptedCategories;
  },

  _onCollapsedChange: function (m, isCollapsed) {
    this.dataviewModel.set('enabled', !isCollapsed);
  }

});
