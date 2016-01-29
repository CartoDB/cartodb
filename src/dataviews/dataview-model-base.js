var _ = require('underscore');
var Model = require('../core/model');
var WindshaftFiltersBoundingBoxFilter = require('../windshaft/filters/bounding-box');

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

    if (!opts.map) {
      throw new Error('map is required');
    }
    if (!opts.windshaftMap) {
      throw new Error('windshaftMap is required');
    }

    if (!attrs.id) {
      this.set('id', attrs.type + '-' + this.cid);
    }

    this.layer = opts.layer;
    this._map = opts.map;
    this._windshaftMap = opts.windshaftMap;

    // filter is optional, so have to guard before using it
    this.filter = opts.filter;
    if (this.filter) {
      this.filter.set('dataviewId', this.id);
    }

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._windshaftMap, 'instanceCreated', this._onNewWindshaftMapInstance);

    this.listenToOnce(this, 'change:url', function () {
      this._fetch(this._onChangeBinds.bind(this));
    });

    // Retrigger an event when the filter changes
    if (this.filter) {
      this.listenTo(this.filter, 'change', this._onFilterChanged);
    }
  },

  _onNewWindshaftMapInstance: function (windshaftMapInstance, sourceLayerId) {
    var url = windshaftMapInstance.getDataviewURL({
      dataviewId: this.get('id'),
      protocol: 'http'
    });

    if (url) {
      var silent = (sourceLayerId && sourceLayerId !== this.layer.get('id'));

      // TODO: Instead of setting the url here, we could invoke fetch directly
      this.set('url', url, { silent: silent });
    }
  },

  _onMapBoundsChanged: function () {
    this._updateBoundingBox();
  },

  _updateBoundingBox: function () {
    var boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this._map.getViewBounds());
    this.set('boundingBox', boundingBoxFilter.toString());
  },

  _onChangeBinds: function () {
    var BOUNDING_BOX_FILTER_WAIT = 500;
    this.listenTo(this._map, 'change:center change:zoom', _.debounce(this._onMapBoundsChanged.bind(this), BOUNDING_BOX_FILTER_WAIT));

    this.listenTo(this, 'change:url', function () {
      if (this._shouldFetchOnURLChange()) {
        this._fetch();
      }
    });
    this.listenTo(this, 'change:boundingBox', function () {
      if (this._shouldFetchOnBoundingBoxChange()) {
        this._fetch();
      }
    });

    this.listenTo(this, 'change:enabled', function (mdl, isEnabled) {
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
    });
  },

  _shouldFetchOnURLChange: function () {
    return this.get('syncData') && this.get('enabled');
  },

  _shouldFetchOnBoundingBoxChange: function () {
    return this.get('enabled') && this.get('syncBoundingBox');
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
    this._map.reload({
      sourceLayerId: this.layer.get('id')
    });
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
  },

  remove: function () {
    if (this.filter) {
      this.filter.remove();
    }
    this.trigger('destroy', this);
    this.stopListening();
  }
});
