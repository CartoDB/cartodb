var _ = require('underscore');
var Template = require('../core/template');
var Search = require('../geo/ui/search/search');
var TilesLoader = require('../geo/ui/tiles-loader');
var Zoom = require('../geo/ui/zoom/zoom-view');
var FullScreen = require('../ui/common/fullscreen/fullscreen-view');
var AttributionView = require('../geo/ui/attribution/attribution-view');
var LogoView = require('../geo/ui/logo-view');
var log = require('cdb.log');

var OverlaysFactory = function (deps) {
  deps = deps || {};
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.visView) throw new Error('visView is required');

  this._mapModel = deps.mapModel;
  this._mapView = deps.mapView;
  this._visView = deps.visView;
};

OverlaysFactory._constructors = {};

OverlaysFactory.register = function (type, creatorFn) {
  this._constructors[type] = creatorFn;
};

OverlaysFactory.prototype.create = function (type, data) {
  var overlayConstructor = this.constructor._constructors[type];
  if (!overlayConstructor) {
    log.log("Overlays of type '" + type + "' are not supported anymore");
    return;
  }

  data.options = typeof data.options === 'string' ? JSON.parse(data.options) : data.options;
  data.options = data.options || {};
  var overlay = overlayConstructor(data, {
    mapModel: this._mapModel,
    mapView: this._mapView,
    visView: this._visView
  });

  if (overlay) {
    overlay.type = type;
    return overlay;
  }

  return false;
};

// Register overlays

OverlaysFactory.register('logo', function (data, deps) {
  var overlay = new LogoView();
  return overlay.render();
});

OverlaysFactory.register('attribution', function (data, deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');

  var overlay = new AttributionView({
    map: deps.mapModel
  });

  return overlay.render();
});

OverlaysFactory.register('zoom', function (data, deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');

  var opts = {
    model: deps.mapModel
  };

  var zoom = new Zoom(opts);
  return zoom.render();
});

OverlaysFactory.register('loader', function (data) {
  var tilesLoader = new TilesLoader();
  return tilesLoader.render();
});

OverlaysFactory.register('layer_selector', function (data, deps) {});

OverlaysFactory.register('fullscreen', function (data, deps) {
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.visView) throw new Error('visView is required');

  var options = _.extend(data, {
    doc: deps.visView.$el.find('> div').get(0),
    allowWheelOnFullscreen: false,
    mapView: deps.mapView
  });

  if (data.template) {
    options.template = Template.compile(
      data.template,
      data.templateType || 'mustache'
    );
  }

  var fullscreen = new FullScreen(options);
  return fullscreen.render();
});

OverlaysFactory.register('search', function (data, deps) {
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.mapModel) throw new Error('mapModel is required');

  var opts = _.extend(data, {
    mapView: deps.mapView,
    model: deps.mapModel
  });

  if (data.template) {
    opts.template = Template.compile(data.template, data.templateType || 'mustache');
  }
  var search = new Search(opts);
  return search.render();
});

OverlaysFactory.register('custom', function (data, deps) {
  var customOverlayView = data;
  return customOverlayView.render();
});

module.exports = OverlaysFactory;

