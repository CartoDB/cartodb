var _ = require('underscore');
var Backbone = require('backbone');
var WidgetModel = require('../widget_model');
var WidgetSearchModel = require('./search_model.js');
var CategoriesCollection = require('./categories_collection');
var MAXCATEGORIES = 12;

/**
 * Category widget model
 */
module.exports = WidgetModel.extend({

  initialize: function(attrs, opts) {
    this._data = new CategoriesCollection(this.get('data'));
    WidgetModel.prototype.initialize.call(this, attrs, opts);

    // Search model
    this.search = new WidgetSearchModel({}, {
      filter: this.filter
    });
  },

  _onChangeBinds: function() {
    WidgetModel.prototype._onChangeBinds.call(this);

    this.search.set({
      url: this.get('url'),
      boundingBox: this.get('boundingBox')
    });
    
    this.bind('change:url change:boundingBox', function() {
      this.search.set({
        url: this.get('url'),
        boundingBox: this.get('boundingBox')
      });
    }, this);
  },

  getData: function() {
    return this._data;
  },

  getSearch: function() {
    return this.search;
  },

  getSize: function() {
    return this._data.size();
  },

  getCount: function() {
    return this.get('categoriesCount');
  },

  toJSON: function() {
    return {
      type: "aggregation",
      options: {
        column: this.get('column'),
        aggregation: this.get('aggregation')
      }
    };
  },

  _parseData: function(categories) {
    // Get info stats from categories
    var min = 0;
    var max = 0;
    var totalCount = 0;
    var newData = [];
    var _tmpArray = {};

    _.each(categories, function(datum) {
      var category = datum.category;
      var count = datum.value;
      var isRejected = this.filter.isRejected(category);
      min = Math.min(min, count);
      max = Math.max(max, count);
      totalCount = totalCount + count;
      _tmpArray[category] = true;
      newData.push({
        'selected': !isRejected,
        'name': category,
        'agg': datum.agg,
        'value': count
      });
    }, this);

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

  _onFilterChanged: function(filter) {
    this.trigger('change:filter', this, filter);
  }
});
