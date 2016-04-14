var _ = require('underscore');
var WidgetModel = require('../widget-model');
var CategoryColors = require('./category-colors');
var LockedCategoriesCollection = require('./locked-categories-collection');

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
    this.colors = new CategoryColors();
    this.lockedCategories = new LockedCategoriesCollection();

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
    var colors = this.colors.colors;
    var defColor = Object.keys(colors).filter(function(k){return colors[k] === 'Other'})[0]
    style = ['#layer[mapnik-geometry-type=polygon]{',
               '  polygon-fill: {{defaultColor}}',
               '  polygon-opacity: 0.6;  ',
               '  line-color: #FFF;',
               '  line-width: 0.3;',
               '  line-opacity: 0.3;',
               '}',
               '#layer[mapnik-geometry-type=point]{',
               '  marker-width: 7;',
               '  marker-fill-opacity: 0.4;  ',
               '  marker-fill: {{defaultColor}};  ',
               '  marker-line-color: #fff;',
               '  marker-allow-overlap: true;',
               '  marker-line-width: 0.3;',
               '  marker-line-opacity: 0.8;',
               '}',
               '#layer[mapnik-geometry-type=linestring]{',
               '  line-color: {{defaultColor}};',
               '  line-width: 0.3;',
               '  line-opacity: 0.3;',
               '}'
              ].join('\n').replace(/{{defaultColor}}/g, defColor)
    delete colors[defColor]
    var ramp = Object.keys(colors).map(function (c) {
      return '#layer' + '['+this.dataviewModel.get('column')+'=\'' + colors[c] + '\']{\nmarker-fill: ' + c + ';\n}'
    }.bind(this)).join('\n');
    style += '\n' + ramp;
    if (!this.dataviewModel._dataProvider) {
      this.dataviewModel.tempStyle = style;
    } else {
      var index = this.dataviewModel._dataProvider._layerIndex;
      var sublayer = this.dataviewModel._dataProvider._vectorLayerView;
      sublayer.setCartoCSS(index, style, true)
    }
    this.dataviewModel.set('auto-style', true);
  },

  cancelAutoStyle: function () {
    if (!this.dataviewModel._dataProvider) {
      delete this.dataviewModel.tempStyle
    } else {
      var index = this.dataviewModel._dataProvider._layerIndex;
      var sublayer = this.dataviewModel._dataProvider._vectorLayerView;
      sublayer.setCartoCSS(index, this.originalStyle, true);
    }
    this.dataviewModel.set('auto-style', false);
  },

  isColorApplied: function () {
    return this.dataviewModel.get('auto-style');
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
    this.colors.updateData(names);
    if (this.isColorApplied()) {
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
