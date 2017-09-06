var _ = require('underscore');
var log = require('cdb.log');

var OVERLAYS = require('./overlays');

var OverlaysFactory = function (opts) {
  opts = opts || {};
  if (!opts.mapModel) throw new Error('mapModel is required');
  if (!opts.mapView) throw new Error('mapView is required');
  if (!opts.visView) throw new Error('visView is required');

  this._mapModel = opts.mapModel;
  this._mapView = opts.mapView;
  this._visView = opts.visView;
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

_.each(OVERLAYS, function (value, key) {
  OverlaysFactory.register(key, value);
});

module.exports = OverlaysFactory;

