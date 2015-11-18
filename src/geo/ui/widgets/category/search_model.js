var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cdb');
var Model = require('cdb/core/model');
var CategoriesCollection = require('./categories_collection');

/**
 * Category search model
 */
module.exports = Model.extend({

  defaults: {
    q: '',
    data: [],
    url: ''
  },

  url: function() {
    return this.get('url') + '/search?q=' + encodeURIComponent(this.get('q')) +
    '&bbox=' + this.get('boundingBox');
  },

  initialize: function(attrs, opts) {
    // Locked collection will have the status
    // of the selected/locked items
    this.locked = opts.locked;
    this._data = new CategoriesCollection();
    this._initBinds();
  },

  _initBinds: function() {
    this._data.bind('change:selected', this._onChangeSelected, this);
    this.bind('change:boundingBox', function() {
      if (this.isSearchApplied()) {
        this.fetch();
      }
    }, this);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  getCount: function() {
    return this.getSize();
  },

  isValid: function() {
    var str = this.get('q');
    return !!(str||'');
  },

  isLocked: function() {},

  resetData: function() {
    this._data.reset([]);
    this.set({
      data: [],
      q: ''
    });
  },

  isSearchApplied: function() {
    return this.isValid() && this.getSize() > 0;
  },

  _onChangeSelected: function(mdl, isSelected) {
    this.locked[ isSelected ? 'addItem' : 'removeItem' ](mdl);
  },

  parse: function(r) {
    var newData = [];
    _.each(r.categories, function(d) {
      var category = d.category;
      var isLocked = this.locked.isItemLocked(category);
      newData.push({
        selected: isLocked,
        name: category,
        agg: d.agg,
        value: d.value
      });
    }, this);
    this._data.reset(newData);

    return {
      data: newData
    }
  },

  fetch: function(opts) {
    this.trigger("loading", this);
    return Model.prototype.fetch.call(this,opts);
  }

});
