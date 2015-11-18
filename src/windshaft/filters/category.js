var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFilterBase = require('./base');
var MAXDATACOUNT = 12;

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

  accept: function(values, applyFilter) {
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

    if (applyFilter !== false) {
      this.applyFilter();
    }
  },

  acceptAll: function() {
    this.acceptedCategories.reset();
    this.rejectedCategories.reset();
    this.applyFilter();
  },

  isAccepted: function(name) {
    return this.acceptedCategories.where({ name: name }).length > 0;
  },

  getAccepted: function() {
    return this.acceptedCategories;
  },

  hasAccepts: function() {
    return this.acceptedCategories.size() > 0;
  },

  reject: function(values, applyFilter) {
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

    if (applyFilter !== false) {
      this.applyFilter();
    }
  },

  isRejected: function(name) {
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    if (this.rejectedCategories.where({ name: name }).length > 0) {
      return true;
    } else if (acceptCount > 0 && this.acceptedCategories.where({ name: name }).length === 0) {
      return true;
    } else {
      return false;
    }
  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  hasRejects: function() {
    return this.rejectedCategories.size() > 0;
  },

  rejectAll: function(d) {
    this.acceptedCategories.reset();
    this.reject(d, false);
    this.applyFilter();
  },

  cleanFilter: function(triggerChange) {
    this.acceptedCategories.reset();
    this.rejectedCategories.reset();
    if (triggerChange !== false) {
      this.applyFilter();
    }
  },

  applyFilter: function() {
    this.trigger('change', this);
  },

  toJSON: function() {
    var filter = {};
    var maxDataCount = MAXDATACOUNT;
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    var acceptedCats = { accept: _.pluck(this.acceptedCategories.toJSON(), 'name') };
    var rejectedCats = { reject: _.pluck(this.rejectedCategories.toJSON(), 'name') };

    // TODO: review this block of code + other possibilities
    if (!this.isEmpty()) {
      if (acceptCount > 0 && acceptCount < maxDataCount && rejectCount < maxDataCount) {
        filter = acceptedCats;
      } else if (acceptCount === 0 && rejectCount > 0 && rejectCount < maxDataCount) {
        filter = rejectedCats;
      } else if (rejectCount >= maxDataCount && acceptCount === 0) {
        // TODO: replace this by empty array when it is available through API
        filter = { accept: ['___@___'] };
      } else if (acceptCount >= maxDataCount && rejectCount === 0) {
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
