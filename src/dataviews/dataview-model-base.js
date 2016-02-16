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
    sync_on_data_change: true,
    sync_on_bbox_change: true,
    enabled: true
  },

  url: function () {
    var params = [];
    if (this.get('boundingBox')) {
      params.push('bbox=' + this.get('boundingBox'));
    }
    return this.get('url') + '?' + params.join('&');
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
      this.set('id', this.defaults.type + '-' + this.cid);
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
    this._updateBoundingBox();
  },

  _initBinds: function () {
    this.listenTo(this._windshaftMap, 'instanceCreated', this._onNewWindshaftMapInstance);

    this.listenToOnce(this, 'change:url', function () {
      this.fetch({
        success: this._onChangeBinds.bind(this)
      });
    });

    // Retrigger an event when the filter changes
    if (this.filter) {
      this.listenTo(this.filter, 'change', this._onFilterChanged);
    }
  },

  /**
   * @private
   */
  _onFilterChanged: function () {
    this._reloadMap();
  },

  /**
   * @protected
   */
  _reloadMap: function () {
    this._map.reload({
      sourceLayerId: this.layer.get('id')
    });
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

    this.on('change:url', function () {
      if (this._shouldFetchOnURLChange()) {
        this.fetch();
      }
    }, this);
    this.on('change:boundingBox', function () {
      if (this._shouldFetchOnBoundingBoxChange()) {
        this.fetch();
      }
    }, this);

    this.on('change:enabled', function (mdl, isEnabled) {
      if (isEnabled) {
        if (mdl.changedAttributes(this._previousAttrs)) {
          this.fetch();
        }
      } else {
        this._previousAttrs = {
          url: this.get('url'),
          boundingBox: this.get('boundingBox')
        };
      }
    }, this);
  },

  _shouldFetchOnURLChange: function () {
    return this.get('sync_on_data_change') && this.get('enabled');
  },

  _shouldFetchOnBoundingBoxChange: function () {
    return this.get('enabled') && this.get('sync_on_bbox_change');
  },

  refresh: function () {
    this.fetch();
  },

  update: function (attrs) {
    attrs = _.pick(attrs, this.constructor.ATTRS_NAMES);
    this.set(attrs);
  },

  getData: function () {
    return this.get('data');
  },

  getPreviousData: function () {
    return this.previous('data');
  },

  fetch: function (opts) {
    opts = opts || {};
    this.trigger('loading', this);
    return Model.prototype.fetch.call(this, _.extend(opts, {
      error: function () {
        this.trigger('error');
      }.bind(this)
    }));
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
},

  // Class props
  {
    ATTRS_NAMES: [
      'id',
      'sync_on_data_change',
      'sync_on_bbox_change',
      'enabled'
    ]
  }
);
