var _ = require('underscore');
var Backbone = require('backbone');
var WidgetModel = require('../widget_model');

/**
 * Category widget model
 */
module.exports = WidgetModel.extend({

  initialize: function(attrs, opts) {
    if (opts.filter) {
      this.filter = opts.filter;
    }
    this._data = new Backbone.Collection(this.get('data'));
    WidgetModel.prototype.initialize.call(this);
    this._dataOrigin = new Backbone.Collection(this.get('data'));
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

  parse: function(data) {
    var self = this;
    var categories = data.ownFilterOff.categories;
    var columnName = this.get('column');
    // Add rejected categories + result categories
    var rejectedCats = this.filter.getRejected();

    // If there is no data from the beginning,
    // complete data origin.
    if (this._dataOrigin.isEmpty()) {
      this._dataOrigin.reset(categories);
    }

    // Get max count of all items
    var min = 0;
    var max = 0;
    var totalCount = categories.reduce(function(memo, datum) {
      min = Math.min(min, datum.count);
      max = Math.max(max, datum.count);
      return memo + datum.count;
    }, 0);
    // TODO: change avg after getting the total of categories
    var avg = totalCount / categories.length;

    var newData = _.map(categories, function(datum) {
      var value = datum[columnName];
      var isRejected = rejectedCats.where({ name: value }).length > 0;
      return {
        'selected': !isRejected,
        'name': value,
        'count': datum.count
      };
    }, this);

    // newData = _.sortBy(newData, function(datum) {
    //   return -datum.count;
    // });

    newData.sort(function(a,b) {
      return a.count - b.count || a.selected < b.selected
    });

    var newDataCollection = new Backbone.Collection(newData);

    var restData = this._dataOrigin.map(function(mdl) {
      var value = mdl.get(columnName);
      var isRejected = rejectedCats.where({ name: value }).length > 0;
      var alreadyAdded = newDataCollection.find(function(m){ return m.get('name') === value });

      if (!alreadyAdded) {
        return {
          'selected': !isRejected,
          'name': value,
          'count': 0
        };
      }
    }, this);

    newData = newData.concat(_.compact(restData));
    this._data.reset(newData);
    
    return {
      data: newData,
      min: min,
      max: max,
      avg: avg,
      totalCount: totalCount
    };
  }
});
