var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFilterBase = require('./base');

/**
 *  Filter used by the category widget
 *
 */
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
    var acceptedCount = this.acceptedCategories.size();

    _.each(values, function(value) {
      var d = { name: value };
      var rejectedMdls = this.rejectedCategories.where(d);
      var acceptedMdls = this.acceptedCategories.where(d);
      if (rejectedMdls.length > 0) {
        this.rejectedCategories.remove(rejectedMdls);
      }
      if (!acceptedMdls.length) {
        this.acceptedCategories.add(d);
      }
    }, this);

    this.trigger('change', this);
  },

  acceptAll: function() {
    this.acceptedCategories.reset();
    this.rejectedCategories.reset();
    this.trigger('change', this);
  },

  rejectAll: function(d) {
    this.acceptedCategories.reset();
    this.reject(d);
    // Reject function will trigger change event
  },

  getAccepted: function() {
    return this.acceptedCategories;
  },

  hasAccepts: function() {
    return this.acceptedCategories.size() > 0;
  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  reject: function(values) {
    values = !_.isArray(values) ? [values] : values;

    _.each(values, function(value) {
      var d = { name: value };
      var acceptedMdls = this.acceptedCategories.where(d);
      var rejectedMdls = this.rejectedCategories.where(d);
      if (acceptedMdls.length > 0) {
        this.acceptedCategories.remove(acceptedMdls);
      } else {
        if (!rejectedMdls.length) {
          this.rejectedCategories.add(d);
        }
      }
    }, this);

    this.trigger('change', this);
  },

  isRejected: function(name) {
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    if (this.rejectedCategories.where({ name: name }).length > 0) {
      return true;
    } else if (acceptCount > 0 && this.acceptedCategories.where({ name: name }).length === 0) {
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
    var dataCount = this._dataOrigin.size();
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    var acceptedCats = { accept: _.map(_.pluck(this.acceptedCategories.toJSON(), 'name'), encodeURIComponent) };
    var rejectedCats = { reject: _.map(_.pluck(this.rejectedCategories.toJSON(), 'name'), encodeURIComponent) };

    // TODO: review this block of code + other possibilities
    if (!this.isEmpty()) {
      if (acceptCount > 0 && acceptCount < dataCount && rejectCount < dataCount) {
        filter = acceptedCats;
      } else if (acceptCount === 0 && rejectCount > 0 && rejectCount < dataCount) {
        filter = rejectedCats;
      } else if (rejectCount >= dataCount && acceptCount === 0) {
        // TODO: replace this by empty array when it is available through API
        filter = { accept: ['___@___'] };
      } else if (acceptCount >= dataCount && rejectCount === 0) {
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
