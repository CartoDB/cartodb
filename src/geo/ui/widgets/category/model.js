var _ = require('underscore');
var Backbone = require('backbone');
var WidgetModel = require('../widget_model');

/**
 * Category widget model
 */
module.exports = WidgetModel.extend({

  initialize: function(attrs, opts) {
    this._data = new Backbone.Collection(this.get('data'));
    this._dataOrigin = new Backbone.Collection(this.get('data'));

    WidgetModel.prototype.initialize.call(this, attrs, opts);

    // Retrigger an event when the changes
    this.filter.bind('change', this._onFilterChanged, this);
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
    var avg = !totalCount ? 0 : (totalCount / categories.length).toFixed(2);

    var newData = _.map(categories, function(datum) {
      var value = datum[columnName];
      var isRejected = rejectedCats.where({ name: value }).length > 0;
      return {
        'selected': !isRejected,
        'name': value,
        'count': datum.count
      };
    }, this);

    var restData = this._dataOrigin.map(function(mdl) {
      var value = mdl.get(columnName);
      var isRejected = rejectedCats.where({ name: value }).length > 0;
      var alreadyAdded = _.find(newData, function(m){ return m.name === value });

      if (!alreadyAdded) {
        return {
          'selected': !isRejected,
          'name': value,
          'count': 0
        };
      }
    }, this);

    newData = newData.concat(_.compact(restData));

    newData.sort(function(a,b) {
      if (a.count === b.count) {
        return (a.selected < b.selected) ? 1 : -1;
      } else {
        return (a.count < b.count) ? 1 : -1;
      }
    });

    this._data.reset(newData);

    return {
      data: newData,
      min: min,
      max: max,
      avg: avg,
      totalCount: totalCount
    };
  },

  _onFilterChanged: function(filter) {
    this.trigger('change:filter', this, filter);
  }
});
