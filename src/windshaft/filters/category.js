var _ = require('underscore');
var Backbone = require('backbone');
var WindshaftFilterBase = require('./base');

/**
 *  Filter used by the category widget
 *
 */
module.exports = WindshaftFilterBase.extend({

  defaults: {
    rejectAll: false
  },

  initialize: function() {
    this.rejectedCategories = new Backbone.Collection();
    this.acceptedCategories = new Backbone.Collection();
    this._initBinds();
  },

  _initBinds: function() {
    this.rejectedCategories.bind('add remove', function() {
      this.set('rejectAll', false);
    }, this);
    this.acceptedCategories.bind('add remove', function() {
      this.set('rejectAll', false);
    }, this);
  },

  isEmpty: function() {
    return this.rejectedCategories.size() === 0 && this.acceptedCategories.size() === 0 && !this.get('rejectAll');
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
    this.set('rejectAll', false);
    this.cleanFilter();
  },

  isAccepted: function(name) {
    return this.acceptedCategories.where({ name: name }).length > 0;
  },

  getAccepted: function() {
    return this.acceptedCategories;
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
    } else if (this.get('rejectAll')) {
      return true;
    } else {
      return false;
    }
  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  rejectAll: function() {
    this.set('rejectAll', true);
    this.cleanFilter();
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
    var rejectCount = this.rejectedCategories.size();
    var acceptCount = this.acceptedCategories.size();
    var acceptedCats = { accept: _.pluck(this.acceptedCategories.toJSON(), 'name') };
    var rejectedCats = { reject: _.pluck(this.rejectedCategories.toJSON(), 'name') };

    if (this.get('rejectAll')) {
      // TODO: replace this by empty array when it is available through API
      filter = { accept: ['___@___'] };
    } else if (acceptCount > 0) {
      filter = acceptedCats;
    } else if (rejectCount > 0 && acceptCount === 0) {
      filter = rejectedCats;
    }

    var json = {};
    json[this.get('widgetId')] = filter;

    return json;
  }
});
