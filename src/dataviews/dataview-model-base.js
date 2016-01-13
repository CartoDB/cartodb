var Model = require('../core/model');

/**
 * Default dataview model
 */
module.exports = Model.extend({
  defaults: {
    url: '',
    data: [],
    columns: [],
    syncData: true,
    syncBoundingBox: true,
    enabled: true
  },

  url: function () {
    return this.get('url') + '?bbox=' + this.get('boundingBox');
  },

  initialize: function (attrs, opts) {
    attrs = attrs || {};
    opts = opts || {};

    if (!attrs.id) {
      this.set('id', attrs.type + '-' + this.cid);
    }

    this.layer = opts.layer;

    // filter is optional, so have to guard before using it
    this.filter = opts.filter;
    if (this.filter) {
      this.filter.set('dataviewId', this.id);
    }

    this._initBinds();
  },

  _initBinds: function () {
    this.once('change:url', function () {
      var self = this;
      this._fetch(function () {
        self._onChangeBinds();
      });
    }, this);

    // Retrigger an event when the filter changes
    if (this.filter) {
      this.filter.bind('change', this._onFilterChanged, this);
    }
  },

  _onChangeBinds: function () {
    this.bind('change:url', function () {
      if (this.get('syncData') && this.get('enabled')) {
        this._fetch();
      }
    }, this);
    this.bind('change:boundingBox', function () {
      if (this.get('enabled') && this.get('syncBoundingBox')) {
        this._fetch();
      }
    }, this);

    this.bind('change:enabled', function (mdl, isEnabled) {
      if (isEnabled) {
        if (mdl.changedAttributes(this._previousAttrs)) {
          this._fetch();
        }
      } else {
        this._previousAttrs = {
          url: this.get('url'),
          boundingBox: this.get('boundingBox')
        };
      }
    }, this);
  },

  _fetch: function (callback) {
    var self = this;
    this.fetch({
      success: callback,
      error: function () {
        self.trigger('error');
      }
    });
  },

  refresh: function () {
    this._fetch();
  },

  _onFilterChanged: function (filter) {
    this.trigger('change:filter', this, filter);
  },

  getData: function () {
    return this.get('data');
  },

  getPreviousData: function () {
    return this.previous('data');
  },

  fetch: function (opts) {
    this.trigger('loading', this);
    return Model.prototype.fetch.call(this, opts);
  },

  toJSON: function () {
    throw new Error('toJSON should be defined for each dataview');
  }
});
