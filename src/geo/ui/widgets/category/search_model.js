var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cdb');
var Model = require('cdb/core/model');

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
    this.filter = opts.filter;
    this._data = new Backbone.Collection();
    // Internal array for storing selected items accross different
    // searches
    this._selectedItems = {};
    this._initBinds();
  },

  _initBinds: function() {
    this._data.bind('change:selected', this._onChangeSelected, this);
  },

  setUrl: function(url) {
    this.set('url', url);
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

  resetData: function() {
    this._selectedItems = {};
    this._data.reset([]);
    this.set('data', []);
  },

  getSelectedCategories: function() {
    return _.map(this._selectedItems, function(value, key) {
      return key;
    });
  },

  _onChangeSelected: function(mdl, isSelected) {
    var category = mdl.get('name');
    this._selectedItems[category] = isSelected ? true : null;
  },

  parse: function(r) {
    var newData = [];
    _.each(r.categories, function(d) {
      var category = d.category;
      var isAccepted = this._selectedItems[category] || this.filter.isAccepted(category);
      newData.push({
        selected: isAccepted,
        name: category,
        agg: d.agg,
        value: d.value
      });
    }, this);
    this._data.reset(newData);

    return {
      data: newData
    }
  }

});
