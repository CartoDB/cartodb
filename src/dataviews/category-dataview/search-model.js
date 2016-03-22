var _ = require('underscore');
var Model = require('../../core/model');
var BackboneAbortSync = require('../../util/backbone-abort-sync');
var CategoriesCollection = require('./categories-collection');

/**
 * Category search model
 */
module.exports = Model.extend({
  defaults: {
    q: '',
    data: [],
    url: ''
  },

  url: function () {
    var url = this.get('url') + '/search?q=' + encodeURIComponent(this.get('q'));
    if (this.get('apiKey')) {
      url += '&api_key=' + this.get('apiKey');
    }
    return url;
  },

  initialize: function (attrs, opts) {
    this._data = new CategoriesCollection();
    this.sync = BackboneAbortSync.bind(this);
  },

  fetchIfSearchIsApplied: function () {
    if (this.isSearchApplied()) {
      this.fetch();
    }
  },

  setData: function (data) {
    var categories = this._parseData(data);
    this._data.reset(categories);
    this.set('data', categories);
  },

  getData: function () {
    return this._data;
  },

  getSize: function () {
    return this._data.size();
  },

  getCount: function () {
    return this.getSize();
  },

  isValid: function () {
    var str = this.get('q');
    return !!(str || '');
  },

  resetData: function () {
    this.setData([]);
    this.set('q', '');
  },

  getSearchQuery: function () {
    return this.get('q');
  },

  isSearchApplied: function () {
    return this.isValid() && this.getSize() > 0;
  },

  _parseData: function (categories) {
    var newData = [];
    _.each(categories, function (d) {
      if (!d.agg) {
        newData.push({
          selected: false,
          name: (d.category || d.name).toString(),
          agg: d.agg,
          value: d.value
        });
      }
    }, this);

    return newData;
  },

  parse: function (r) {
    var categories = this._parseData(r.categories);
    this._data.reset(categories);
    return {
      data: categories
    };
  },

  fetch: function (opts) {
    opts = opts || {};

    this.trigger('loading', this);

    if (opts.success) {
      var successCallback = opts && opts.success;
    }

    return Model.prototype.fetch.call(this, _.extend(opts, {
      success: function () {
        successCallback && successCallback(arguments);
        this.trigger('loaded', this);
      }.bind(this),
      error: function (mdl, err) {
        if (!err || (err && err.statusText !== 'abort')) {
          this.trigger('error', mdl, err);
        }
      }.bind(this)
    }));
  }
});
