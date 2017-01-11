var _ = require('underscore');
var Model = require('../core/model');
var Template = require('../core/template');
var Annotation = require('../geo/ui/annotation');
var Search = require('../geo/ui/search/search');
var Text = require('../geo/ui/text');
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

OverlaysFactory.register('text', function (data, deps) {
  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var widget = new Text({
    model: new Model(options),
    template: template,
    className: 'cartodb-overlay overlay-text ' + options.device
  });

  return widget.render();
});

OverlaysFactory.register('annotation', function (data, deps) {
  if (!deps.mapView) throw new Error('mapView is required');

  var options = data.options;

  var template = Template.compile(
    data.template || [
      '<div class="content">',
      '<div class="text widget_text">{{{ text }}}</div>',
      '<div class="stick"><div class="ball"></div></div>',
      '</div>'
    ].join('\n'),
    data.templateType || 'mustache'
  );

  var widget = new Annotation({
    className: 'cartodb-overlay overlay-annotation ' + options.device,
    template: template,
    mapView: deps.mapView,
    device: options.device,
    text: options.extra.rendered_text,
    minZoom: options.style['min-zoom'],
    maxZoom: options.style['max-zoom'],
    latlng: options.extra.latlng,
    style: options.style
  });

  return widget.render();
});

// map zoom control
OverlaysFactory.register('zoom', function (data, deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');

  var opts = {
    model: deps.mapModel
  };

  var zoom = new Zoom(opts);
  return zoom.render();
});

// Tiles loader
OverlaysFactory.register('loader', function (data) {
  var tilesLoader = new TilesLoader();
  return tilesLoader.render();
});

// layer_selector
OverlaysFactory.register('layer_selector', function (data, deps) {});

// fullscreen
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

// share content
OverlaysFactory.register('share', function (data, deps) {});

// search content
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

