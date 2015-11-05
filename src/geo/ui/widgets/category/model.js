var _ = require('underscore');
var Backbone = require('backbone');
var WidgetModel = require('../widget_model');

/**
 * Category widget model
 */
module.exports = WidgetModel.extend({

  initialize: function(attrs, opts) {
    this._data = new Backbone.Collection(this.get('data'));
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
    var categories = data.ownFilterOff.categories;
    var columnName = this.get('column');
    var maxCount = categories.reduce(function(memo, datum) {
      return memo + datum.count;
    }, 0);

    // Add rejected categories + result categories
    var rejectedCats = this.filter.getRejected();

    var newData = _.map(categories, function(datum) {
      var value = datum[columnName];
      var isRejected = rejectedCats.where({ name: value }).length > 0;
      return {
        'selected': !isRejected,
        'name': value,
        'count': datum.count,
        'maxCount': maxCount
      };
    }, this);

    this._data.reset(newData);

    return {
      data: newData
    };
  },

  _onFilterChanged: function(filter) {
    this.trigger('change:filter', this, filter);
  }
});
