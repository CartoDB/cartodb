var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFilterBase = require('./base');

module.exports = WindshaftFilterBase.extend({

  initialize: function() {
    this.acceptedCategories = new Backbone.Collection();
    this.rejectedCategories = new Backbone.Collection();
  },

  isEmpty: function() {
    return this.rejectedCategories.size() === 0 && this.acceptedCategories.size() === 0;
  },

  accept: function(values) {
    values = !_.isArray(values) ? [values] : values;
    var arr = [];
    _.each(values, function(value) {
      var mdls = this.acceptedCategories.where({ name: value });
      if (mdls.length === 0) {
        arr.push({ name: value });
      }
    }, this);
    if (arr.length > 0) {
      this.acceptedCategories.add(arr);
      this.rejectedCategories.remove(arr);
      this.trigger('change', this);
    }
  },

  acceptAll: function() {
    this.acceptedCategories.reset();
    this.rejectedCategories.reset();
    this.trigger('change', this);
  },

  reject: function(values) {
    values = !_.isArray(values) ? [values] : values;
    var arr = [];
    _.each(values, function(value) {
      var mdls = this.rejectedCategories.where({ name: value });
      if (mdls.length === 0) {
        arr.push({ name: value });
      }
    }, this);
    if (arr.length > 0) {
      this.rejectedCategories.add(arr);
      this.acceptedCategories.remove(arr);
      this.trigger('change', this);
    }
  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  hasRejects: function() {
    return this.rejectedCategories.size() > 0;
  },

  toJSON: function() {
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    var filter = {};

    if (!this.isEmpty()) {
      if (acceptCount >= rejectCount) {
        filter['accept'] = _.map(_.pluck(this.acceptedCategories.toJSON(), 'name'), encodeURIComponent);
      } else {
        filter['reject'] = _.map(_.pluck(this.rejectedCategories.toJSON(), 'name'), encodeURIComponent);
      }
    }

    var json = {};
    json[this.get('widgetId')] = filter;
    return json;
  }
});
