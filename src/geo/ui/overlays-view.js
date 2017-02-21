var _ = require('underscore');
var util = require('cdb.core.util');
var View = require('../../core/view');
var OverlaysFactory = require('../../vis/overlays-factory');
var overlayContainerTemplate = require('./overlays-container.tpl');

var CONTAINED_OVERLAYS = ['fullscreen', 'search', 'attribution', 'zoom', 'logo'];

var OverlaysView = View.extend({

  initialize: function (deps) {
    if (!deps.overlaysCollection) throw new Error('overlaysCollection is required');
    if (!deps.visModel) throw new Error('visModel is required');
    if (!deps.visView) throw new Error('visView is required');
    if (!deps.mapModel) throw new Error('mapModel is required');
    if (!deps.mapView) throw new Error('mapView is required');

    this._overlaysCollection = deps.overlaysCollection;
    this._visModel = deps.visModel;
    this._visView = deps.visView;
    this._mapModel = deps.mapModel;
    this._mapView = deps.mapView;

    this._overlayViews = [];
    this._overlaysFactory = new OverlaysFactory({
      mapModel: this._mapModel,
      mapView: this._mapView,
      visView: this._visView
    });

    this._visModel.on('change:loading', this._toggleLoaderOverlay, this);

    this._overlaysCollection.on('add remove change', this.render, this);

    this.$el.append(overlayContainerTemplate());
  },

  render: function () {
    this._clearOverlays();
    this._renderOverlays();
    return this;
  },

  _clearOverlays: function () {
    while (this._overlayViews.length !== 0) {
      this._overlayViews.pop().clean();
    }
  },

  _renderOverlays: function () {
    var overlays = this._overlaysCollection.toJSON();

    // Sort the overlays by its internal order
    overlays = _.sortBy(overlays, function (overlay) {
      return overlay.order === null ? Number.MAX_VALUE : overlay.order;
    });

    _(overlays).each(function (data) {
      this._renderOverlay(data);
    }, this);
  },

  _renderOverlay: function (overlay) {
    var overlayView = this._createOverlayView(overlay);
    if (overlayView) {
      overlayView.render();
      if (this._isGlobalOverlay(overlay)) {
        this.$el.append(overlayView.el);
      } else {
        this._overlayContainer().append(overlayView.el);
      }
      this.addView(overlayView);
      this._overlayViews.push(overlayView);

      // IE<10 doesn't support the Fullscreen API
      var type = overlay.type;
      if (type === 'fullscreen' && util.browser.ie && util.browser.ie.version <= 10) return;
    }
  },

  _createOverlayView: function (overlay) {
    return this._overlaysFactory.create(overlay.type, overlay, {
      visView: this._visView,
      map: this._mapModel
    });
  },

  _isGlobalOverlay: function (overlay) {
    return CONTAINED_OVERLAYS.indexOf(overlay.type) === -1;
  },

  _overlayContainer: function () {
    return this.$('.CDB-OverlayContainer');
  },

  _toggleLoaderOverlay: function () {
    var loaderOverlay = this._getLoaderOverlay();
    if (loaderOverlay) {
      if (this._visModel.get('loading')) {
        loaderOverlay.show();
      } else {
        loaderOverlay.hide();
      }
    }
  },

  _getLoaderOverlay: function () {
    return this._getOverlayViewByType('loader');
  },

  _getOverlayViewByType: function (type) {
    return _(this._overlayViews).find(function (v) {
      return v.type === type;
    });
  },

  clean: function () {
    View.prototype.clean.apply(this);
    this._clearOverlays();
  }
});

module.exports = OverlaysView;
