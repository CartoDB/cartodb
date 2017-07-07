var _ = require('underscore');
var Model = require('../core/model');
var BackboneAbortSync = require('../util/backbone-abort-sync');
var WindshaftFiltersBoundingBoxFilter = require('../windshaft/filters/bounding-box');
var BOUNDING_BOX_FILTER_WAIT = 500;

var UNFETCHED_STATUS = 'unfeteched';
var FETCHING_STATUS = 'fetching';
var FETCHED_STATUS = 'fetched';
var FETCH_ERROR_STATUS = 'error';

/**
 * Default dataview model
 */
module.exports = Model.extend({
  defaults: {
    url: '',
    data: [],
    sync_on_data_change: true,
    sync_on_bbox_change: true,
    enabled: true,
    status: UNFETCHED_STATUS
  },

  url: function () {
    var params = _.union(
      [ this._getBoundingBoxFilterParam() ],
      this._getDataviewSpecificURLParams()
    );

    if (this.get('apiKey')) {
      params.push('api_key=' + this.get('apiKey'));
    } else if (this.get('authToken')) {
      var authToken = this.get('authToken');
      if (authToken instanceof Array) {
        _.each(authToken, function (token) {
          params.push('auth_token[]=' + token);
        });
      } else {
        params.push('auth_token=' + authToken);
      }
    }
    return this.get('url') + '?' + params.join('&');
  },

  _getBoundingBoxFilterParam: function () {
    var result = '';
    var boundingBoxFilter;

    if (this.syncsOnBoundingBoxChanges()) {
      boundingBoxFilter = new WindshaftFiltersBoundingBoxFilter(this._getMapViewBounds());
      result = 'bbox=' + boundingBoxFilter.toString();
    }

    return result;
  },

  _getMapViewBounds: function () {
    return this._map.getViewBounds();
  },

  /**
   * Subclasses might override this method to define extra params that will be appended
   * to the dataview's URL.
   * @return {[Array]} An array of strings in the form of "key=value".
   */
  _getDataviewSpecificURLParams: function () {
    return [];
  },

  initialize: function (attrs, opts) {
    attrs = attrs || {};
    opts = opts || {};

    if (!opts.map) throw new Error('map is required');
    if (!opts.vis) throw new Error('vis is required');
    if (!opts.analysisCollection) throw new Error('analysisCollection is required');
    if (!attrs.source) throw new Error('source is a required attr');

    if (!attrs.id) {
      this.set('id', this.defaults.type + '-' + this.cid);
    }

    this.layer = opts.layer;
    this._map = opts.map;
    this._vis = opts.vis;
    this._analysisCollection = opts.analysisCollection;

    this.sync = BackboneAbortSync.bind(this);

    // filter is optional, so have to guard before using it
    this.filter = opts.filter;
    if (this.filter) {
      this.filter.set('dataviewId', this.id);
    }

    this._initBinds();
    this._setupAnalysisStatusEvents();
  },

  _getLayerDataProvider: function () {
    return this.layer.getDataProvider();
  },

  _initBinds: function () {
    this.listenTo(this.layer, 'change:visible', this._onLayerVisibilityChanged);
    this.listenTo(this.layer, 'change:source', this._setupAnalysisStatusEvents);
    this.on('change:source', this._setupAnalysisStatusEvents, this);

    var layerDataProvider = this._getLayerDataProvider();
    if (layerDataProvider) {
      this.listenToOnce(layerDataProvider, 'dataChanged', this._onChangeBinds, this);
      this.listenTo(layerDataProvider, 'dataChanged', this.fetch);
    } else {
      this.listenToOnce(this, 'change:url', function () {
        if (this.syncsOnBoundingBoxChanges() && !this._getMapViewBounds()) {
          // wait until map gets bounds from view
          this._map.on('change:view_bounds_ne', function () {
            this._initialFetch();
          }, this);
        } else {
          this._initialFetch();
        }
      });
    }

    if (this.filter) {
      this.listenTo(this.filter, 'change', this._onFilterChanged);
    }
  },

  _onChangeBinds: function () {
    this.on('change:sync_on_bbox_change', function () {
      this.refresh();
    }, this);

    this.listenTo(this._map, 'change:center change:zoom', _.debounce(this._onMapBoundsChanged.bind(this), BOUNDING_BOX_FILTER_WAIT));

    this.on('change:url', function (model, value, opts) {
      if (this.syncsOnDataChanges()) {
        this._newDataAvailable = true;
      }
      if (this._shouldFetchOnURLChange(opts && _.pick(opts, ['forceFetch', 'sourceId']))) {
        this.fetch();
      }
    }, this);

    this.on('change:enabled', function (mdl, isEnabled) {
      if (isEnabled && this._newDataAvailable) {
        this.fetch();
        this._newDataAvailable = false;
      }
    }, this);
  },

  _onMapBoundsChanged: function () {
    if (this._shouldFetchOnBoundingBoxChange()) {
      this.fetch();
    }

    if (this.syncsOnBoundingBoxChanges()) {
      this._newDataAvailable = true;
    }
  },

  _initialFetch: function () {
    this.fetch({
      success: this._onChangeBinds.bind(this)
    });
  },

  _setupAnalysisStatusEvents: function () {
    this._removeExistingAnalysisBindings();
    this._analysis = this.getSource();
    if (this._analysis) {
      this._analysis.on('change:status', this._onAnalysisStatusChange, this);
    }
  },

  _removeExistingAnalysisBindings: function () {
    if (!this._analysis) return;
    this._analysis.off('change:status', this._onAnalysisStatusChange, this);
  },

  _onAnalysisStatusChange: function (analysis, status) {
    if (analysis.isLoading()) {
      this._triggerLoading();
    } else if (analysis.isFailed()) {
      this._triggerError(analysis.get('error'));
    }
    // loaded will be triggered through the default behavior, so not necessary to react on that status here
  },

  _triggerLoading: function () {
    this.trigger('loading', this);
  },

  _triggerError: function (error) {
    this.trigger('error', this, error);
  },

  /**
   * @protected
   */

  _onFilterChanged: function (filter) {
    var layerDataProvider = this._getLayerDataProvider();
    if (layerDataProvider && layerDataProvider.canApplyFilterTo(this)) {
      layerDataProvider.applyFilter(this, filter);
    } else {
      this._reloadVis();
    }
  },

  _reloadVis: function (opts) {
    opts = opts || {};
    this._vis.reload(
      _.extend(
        opts, {
          sourceId: this.getSourceId()
        }
      )
    );
  },

  _reloadVisAndForceFetch: function () {
    this._reloadVis({
      forceFetch: true
    });
  },

  /**
   * Enable/disable the dataview depending on the layer visibility.
   * @private
   * @param  {LayerModel} model the layer model which visible property has changed.
   * @param  {Boolean} value New value for visible.
   * @returns {void}
   */
  _onLayerVisibilityChanged: function (model, value) {
    this.set({enabled: value});
  },

  _shouldFetchOnURLChange: function (options) {
    options = options || {};
    var sourceId = options.sourceId;
    var forceFetch = options.forceFetch;

    if (forceFetch) {
      return true;
    }

    return this.isEnabled() &&
      this.syncsOnDataChanges() &&
        this._sourceAffectsMyOwnSource(sourceId);
  },

  _sourceAffectsMyOwnSource: function (sourceId) {
    if (!sourceId) {
      return true;
    }
    var sourceAnalysis = this.getSource();
    return sourceAnalysis && sourceAnalysis.findAnalysisById(sourceId);
  },

  _shouldFetchOnBoundingBoxChange: function () {
    return this.isEnabled() &&
      this.syncsOnBoundingBoxChanges();
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
    this.set('status', FETCHING_STATUS);
    var layerDataProvider = this._getLayerDataProvider();
    if (layerDataProvider && layerDataProvider.canProvideDataFor(this)) {
      this.set(this.parse(layerDataProvider.getDataFor(this)));
    } else {
      this._triggerLoading();

      if (opts.success) {
        var successCallback = opts && opts.success;
      }

      return Model.prototype.fetch.call(this, _.extend(opts, {
        success: function () {
          this.set('status', FETCHED_STATUS);
          successCallback && successCallback(arguments);
          this.trigger('loaded', this);
        }.bind(this),
        error: function (mdl, err) {
          this.set('status', FETCH_ERROR_STATUS);
          if (!err || (err && err.statusText !== 'abort')) {
            this._triggerError(err);
          }
        }.bind(this)
      }));
    }
  },

  toJSON: function () {
    throw new Error('toJSON should be defined for each dataview');
  },

  getSourceType: function () {
    var sourceAnalysis = this.getSource();
    return sourceAnalysis && sourceAnalysis.get('type');
  },

  getLayerName: function () {
    return this.layer && this.layer.get('layer_name');
  },

  getSource: function () {
    var sourceId = this.getSourceId();
    return sourceId && this._analysisCollection.get(sourceId);
  },

  getSourceId: function () {
    // Dataview is pointing to a layer that has a source, so its
    // source is actually the the layers's source
    if (this.hasLayerAsSource() && this.layer.has('source')) {
      return this.layer.get('source');
    }

    // Dataview is pointing to a layer with `sql` or an analysis
    // node directly, so just return the id that has been set by
    // dataviews-factory.js
    return this._ownSourceId();
  },

  _ownSourceId: function () {
    return this.has('source') && this.get('source').id;
  },

  hasLayerAsSource: function () {
    return this._ownSourceId() === this.layer.id;
  },

  isFiltered: function () {
    var isFiltered = false;
    if (this.filter) {
      isFiltered = !this.filter.isEmpty();
    }
    return isFiltered;
  },

  remove: function () {
    this._removeExistingAnalysisBindings();
    this.trigger('destroy', this);
    this.stopListening();
  },

  isFetched: function () {
    return this.get('status') === FETCHED_STATUS;
  },

  isUnavailable: function () {
    return this.get('status') === FETCH_ERROR_STATUS;
  },

  isEnabled: function () {
    return this.get('enabled');
  },

  syncsOnDataChanges: function () {
    return this.get('sync_on_data_change');
  },

  syncsOnBoundingBoxChanges: function () {
    return this.get('sync_on_bbox_change');
  }
},

  // Class props
  {
    ATTRS_NAMES: [
      'id',
      'sync_on_data_change',
      'sync_on_bbox_change',
      'enabled',
      'source'
    ]
  }
);
