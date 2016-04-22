var _ = require('underscore');
var WidgetModel = require('../widget-model');
var LockedCategoriesCollection = require('./locked-categories-collection');
var AutoStyler = require('../auto-styler');

/**
 * Model for a category widget
 */
module.exports = WidgetModel.extend({

  defaults: _.extend(
    {
      type: 'category',
      search: false,
      locked: false
    },
    WidgetModel.prototype.defaults
  ),

  initialize: function () {
    WidgetModel.prototype.initialize.apply(this, arguments);
    this.lockedCategories = new LockedCategoriesCollection();
    this.autoStyler = new AutoStyler(this.dataviewModel);
    this.listenTo(this.dataviewModel, 'change:allCategoryNames', this._onDataviewAllCategoryNamesChange);
    this.on('change:locked', this._onLockedChange, this);
    this.on('change:collapsed', this._onCollapsedChange, this);
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
    var style = this.autoStyler.getStyle();
    this.dataviewModel.layer.set('cartocss', style);
    this.dataviewModel.set('autoStyle', true);
  },

  cancelAutoStyle: function () {
    this.dataviewModel.layer.restoreCartoCSS();
    this.dataviewModel.set('autoStyle', false);
  },

  isAutoStyle: function () {
    return this.dataviewModel.get('autoStyle');
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
    this.autoStyler.colors.updateData(names);
    if (this.isAutoStyle()) {
      this.autoStyle();
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
