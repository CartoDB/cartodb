var Model = require('cdb/core/model');

/**
 * Default widget model
 */
module.exports = Model.extend({

  defaults: {
    url: '',
    data: [],
    columns: [],
    sync: true,
    bbox: true
  },

  url: function() {
    return this.get('url') + '?bbox=' + this.get('boundingBox');
  },

  initialize: function(attrs, opts) {
    if (opts && opts.filter) {
      this.filter = opts.filter;
    }

    this._initBinds();
  },

  _initBinds: function() {
    this.once('change:url', function() {
      var self = this;
      this._fetch(function() {
        self._onChangeBinds();
      });
    }, this);

    // Retrigger an event when the filter changes
    if (this.filter) {
      this.filter.bind('change', this._onFilterChanged, this);
    }
  },

  _onChangeBinds: function() {
    this.bind('change:url', function(){
      if (this.get('sync')) {
        this._fetch();
      }
    }, this);
    this.bind('change:boundingBox', function() {
      if (this.get('bbox')) {
        this._fetch();
      }
    }, this);
  },

  _fetch: function(callback) {
    var self = this;
    this.fetch({
      success: callback,
      error: function() {
        self.trigger('error');
      }
    });
  },

  refresh: function() {
    this._fetch();
  },

  _onFilterChanged: function(filter) {
    this.trigger('change:filter', this, filter);
  },

  getData: function() {
    return this.get('data');
  },

  fetch: function(opts) {
    this.trigger("loading", this);
    return Model.prototype.fetch.call(this,opts);
  },

  getFilter: function() {
    return this.filter;
  },

  toJSON: function() {
    throw new Error('toJSON should be defined for each widget');
  }
});
