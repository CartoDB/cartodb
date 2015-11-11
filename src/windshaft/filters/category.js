var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFilterBase = require('./base');

module.exports = WindshaftFilterBase.extend({

  initialize: function() {
    this.rejectedCategories = new Backbone.Collection();
    this.acceptedCategories = new Backbone.Collection();
  },

  isEmpty: function() {
    return this.rejectedCategories.size() === 0 && this.acceptedCategories.size() === 0;
  },

  // TODO: change this thing
  setDataOrigin: function(collection) {
    this._dataOrigin = collection;
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

  getAccepted: function() {

  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  reject: function(values) {
    values = !_.isArray(values) ? [values] : values;
    var arr = [];
    _.each(values, function(value) {
      var mdls = this.rejectedCategories.where({ name: value })
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

  isRejected: function(name) {
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    if (this.rejectedCategories.where({ name: name }).length > 0) {
      return true;
    } else if (rejectCount === 0 && acceptCount > 0 && this.acceptedCategories.where({ name: name }).length === 0) {
      return true;
    } else {
      return false
    }
  },

  hasRejects: function() {
    return this.rejectedCategories.size() > 0;
  },

  toJSON: function() {
    var filter = {};
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    var acceptedCats = { accept: _.map(_.pluck(this.acceptedCategories.toJSON(), 'name'), encodeURIComponent) };
    var rejectedCats = { reject: _.map(_.pluck(this.rejectedCategories.toJSON(), 'name'), encodeURIComponent) };

    // TODO: review this block of code + other possibilities
    if (!this.isEmpty()) {
      if (rejectCount === 0 && acceptCount > 0 && rejectCount < this._dataOrigin.size()) {
        filter = acceptedCats;
      } else if (acceptCount === 0 && rejectCount > 0 && rejectCount < this._dataOrigin.size()) {
        filter = rejectedCats;
      } else if (rejectCount >= this._dataOrigin.size() && acceptCount === 0) {
        // TODO: replace this by empty array
        filter = { accept: ['_____'] };
      } else if (acceptCount >= this._dataOrigin.size() && rejectCount === 0) {
        filter = {};
      } else {
        _.extend(filter, rejectedCats, acceptedCats);
      }
    }

    var json = {};
    json[this.get('widgetId')] = filter;

    return json;
  }
});
