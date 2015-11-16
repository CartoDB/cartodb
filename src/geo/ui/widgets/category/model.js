var _ = require('underscore');
var Backbone = require('backbone');
var WidgetModel = require('../widget_model');
var CategoriesCollection = require('./categories_collection');

/**
 * Category widget model
 */
module.exports = WidgetModel.extend({

  initialize: function(attrs, opts) {
    this._data = new CategoriesCollection(this.get('data'));
    this._dataOrigin = new Backbone.Collection(this.get('data'));

    WidgetModel.prototype.initialize.call(this, attrs, opts);
    this.filter.setDataOrigin(this._dataOrigin);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
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
    // If there is no data from the beginning,
    // complete data origin.
    if (this._dataOrigin.isEmpty()) {
      this._dataOrigin.reset(categories);
    }

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
        'value': count
      });
    }, this);

    // TODO: change avg after getting the total of categories
    var avg = !totalCount ? 0 : (totalCount / categories.length).toFixed(2);

    this._dataOrigin.each(function(mdl) {
      var value = mdl.get('category');
      var isRejected = this.filter.isRejected(value);
      var alreadyAdded = _tmpArray[value];

      if (!alreadyAdded) {
        newData.push({
          'selected': !isRejected,
          'name': value,
          'value': 0
        });
      }
    }, this);

    return {
      data: newData,
      min: min,
      max: max,
      avg: avg,
      totalCount: totalCount
    };
  },

  setCategories: function(d) {
    var attrs = this._parseData(d);
    this._data.reset(attrs.data);
    this.set(attrs);
  },

  parse: function(d) {
    var categories = d.ownFilterOff.categories;
    var attrs = this._parseData(categories);
    this._data.reset(attrs.data);
    return attrs;
  },

  _onFilterChanged: function(filter) {
    this.trigger('change:filter', this, filter);
  }
});
