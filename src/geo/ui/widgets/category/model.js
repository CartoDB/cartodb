var _ = require('underscore');
var Backbone = require('backbone');
var Model = require('cdb/core/model');
var d3 = require('d3');
var colorbrewer = require('colorbrewer');
var categoryColors = _.initial(colorbrewer.Accent[8]);
var defaultColor = '#CCC';
var WidgetModel = require('../widget_model');
var WidgetSearchModel = require('./models/search_model.js');
var CategoriesCollection = require('./models/categories_collection');
var LockedCatsCollection = require('./models/locked_categories_collection');

/**
 *  Category widget model
 *
 *  - It has several internal models/collections
 *
 *  · search model: it manages category search results.
 *  · locked collection: it stores locked items.
 *  · filter model: it knows which items are accepted or rejected.
 *
 */

module.exports = WidgetModel.extend({

  url: function() {
    return this.get('url') + '?bbox=' + this.get('boundingBox') + '&own_filter=' + (this.get('locked') ? 1 : 0);
  },

  initialize: function(attrs, opts) {
    this._data = new CategoriesCollection();

    WidgetModel.prototype.initialize.call(this, attrs, opts);

    // Locked categories collection
    this.locked = new LockedCatsCollection();

    // Search model
    this.search = new WidgetSearchModel({}, {
      locked: this.locked
    });
  },

  _onChangeBinds: function() {
    // Set url and bounds when they have changed
    this.search.set({
      url: this.get('url'),
      boundingBox: this.get('boundingBox')
    });

    this.bind('change:url', function(){
      if (this.get('sync')) {
        this._fetch();
      }
    }, this);

    this.bind('change:boundingBox', function() {
      // If a search is applied and bounding bounds has changed,
      // don't fetch new raw data
      if (this.get('bbox') && !this.isSearchApplied()) {
        this._fetch();
      }
    }, this);

    this.bind('change:url change:boundingBox', function() {
      this.search.set({
        url: this.get('url'),
        boundingBox: this.get('boundingBox')
      });
    }, this);

    this.locked.bind('change add remove', function() {
      this.trigger('change:lockCollection', this.locked, this);
    }, this);

    this.search.bind('loading', function() {
      this.trigger("loading", this);
    }, this);
    this.search.bind('sync', function() {
      this.trigger("sync", this);
    }, this);
    this.search.bind('error', function(e) {
      if (!e || (e && e.statusText !== "abort")) {
        this.trigger("error", this);
      }
    }, this);
    this.search.bind('change:data', function() {
      this.trigger('change:searchData', this.search, this);
    }, this);
  },

  /*
   *  Helper methods for internal models/collections
   *
   */

  applyCategoryColors: function() {
    this.set('categoryColors', true);
    this.trigger('applyCategoryColors', this._data.map(function(m){
      return [ m.get('name'), m.get('color') ];
    }), this);
  },

  cancelCategoryColors: function() {
    this.set('categoryColors', false);
    this.trigger('cancelCategoryColors', this);
  },

  isColorApplied: function() {
    return this.get('categoryColors');
  },

  // Locked collection helper methods //

  getLockedSize: function() {
    return this.locked.size();
  },

  isLocked: function() {
    return this.get('locked');
  },

  canBeLocked: function() {
    return this.isLocked() ||
      this.getAcceptedCount() > 0;
  },

  canApplyLocked: function() {
    var acceptedCollection = this.filter.getAccepted();
    if (this.filter.getAccepted().size() !== this.locked.size()) {
      return true;
    }

    return acceptedCollection.find(function(m) {
      return !this.locked.isItemLocked(m.get('name'));
    }, this);
  },

  applyLocked: function() {
    var currentLocked = this.locked.getItemsName();
    if (!currentLocked.length) {
      this.unlockCategories();
      return false;
    }
    this.set('locked', true);
    this.filter.cleanFilter(false);
    this.filter.accept(currentLocked);
    this.filter.applyFilter();
    this.cleanSearch();
  },

  lockCategories: function() {
    this.set('locked', true);
    this._fetch();
  },

  unlockCategories: function() {
    this.set('locked', false);
    this.acceptAll();
  },

  // Search model helper methods //

  getSearchQuery: function() {
    return this.search.getSearchQuery();
  },

  setSearchQuery: function(q) {
    this.search.set('q', q);
  },

  isSearchValid: function() {
    return this.search.isValid();
  },

  getSearchResult: function() {
    return this.search.getData();
  },

  getSearchCount: function() {
    return this.search.getCount();
  },

  applySearch: function() {
    this.search.fetch();
  },

  isSearchApplied: function() {
    return this.search.isSearchApplied();
  },

  cleanSearch: function() {
    this.locked.resetItems([]);
    this.search.resetData();
  },

  setupSearch: function() {
    if (!this.isSearchApplied()) {
      var acceptedCats = this.filter.getAccepted().toJSON();
      this.locked.addItems(acceptedCats);
      this.search.setData(
        this._data.toJSON()
      );
    }
  },

  // Filter model helper methods //

  getRejectedCount: function() {
    return this.filter.rejectedCategories.size();
  },

  getAcceptedCount: function() {
    return this.filter.acceptedCategories.size();
  },

  acceptFilters: function(values) {
    this.filter.accept(values);
  },

  rejectFilters: function(values) {
    this.filter.reject(values);
  },

  rejectAll: function() {
    this.filter.rejectAll();
  },

  acceptAll: function() {
    this.filter.acceptAll();
  },

  isAllFiltersRejected: function() {
    return this.filter.get('rejectAll');
  },

  // Proper model helper methods //

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  getCount: function() {
    return this.get('categoriesCount');
  },

  refresh: function() {
    if (this.isSearchApplied()) {
      this.search.fetch();
    } else {
      this._fetch();
    }
  },

  // Data parser methods //

  _parseData: function(categories) {
    // Get info stats from categories
    var newData = [];
    var _tmpArray = {};
    var _tmpCount = 0;

    _.each(categories, function(datum, i) {
      var category = datum.category;
      var isRejected = this.filter.isRejected(category);
      var color = categoryColors[i];
      _tmpArray[category] = true;
      _tmpCount++;

      newData.push({
        selected: !isRejected,
        name: category,
        agg: datum.agg,
        value: datum.value,
        color: color || defaultColor
      });
    }, this);

    if (this.isLocked()) {
      var acceptedCats = this.filter.getAccepted();
      // Add accepted items that are not present in the categories data
      acceptedCats.each(function(mdl, i) {
        var category = mdl.get('name').toString();
        var color = categoryColors[_tmpCount + i];
        if (!_tmpArray[category]) {
          newData.push({
            selected: true,
            color: color || defaultColor,
            name: category,
            agg: false,
            value: 0
          });
        }
      }, this);
    }

    return {
      data: newData
    }
  },

  setCategories: function(d) {
    var attrs = this._parseData(d);
    this._data.reset(attrs.data);
    this.set(attrs);
  },

  parse: function(d) {
    var categories = d.categories;
    var attrs = this._parseData(categories);

    _.extend(attrs, {
        nulls: d.nulls,
        min: d.min,
        max: d.max,
        count: d.count,
        categoriesCount: d.categoriesCount
      }
    );
    this._data.reset(attrs.data);
    return attrs;
  },

  // Backbone toJson function override

  toJSON: function() {
    return {
      type: "aggregation",
      options: {
        column: this.get('column'),
        aggregation: this.get('aggregation'),
        aggregationColumn: this.get('aggregationColumn')
      }
    };
  }

});
