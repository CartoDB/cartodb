var _ = require('underscore');
var log = require('cdb.log');

var GMAPS_BASE_LAYER_TYPES = ['roadmap', 'gray_roadmap', 'dark_roadmap', 'hybrid', 'satellite', 'terrain'];

var VizJSON = function (vizjson) {
  _.each(Object.keys(vizjson), function (property) {
    this[property] = vizjson[property];
  }, this);

  this.overlays = this.overlays || [];
  this.layers = this.layers || [];

  this._addAttributionOverlay();
};

VizJSON.OVERLAY_TYPES = {
  ZOOM: 'zoom',
  ATTRIBUTION: 'attribution',
  LOADER: 'loader',
  SEARCH: 'search',
  HEADER: 'header',
  LAYER_SELECTOR: 'layer_selector'
};

VizJSON.MAP_PROVIDER_TYPES = {
  GMAPS: 'googlemaps',
  LEAFLET: 'leaflet'
}

VizJSON.prototype.hasZoomOverlay = function () {
  return this.hasOverlay(VizJSON.OVERLAY_TYPES.ZOOM);
};

VizJSON.prototype.hasOverlay = function (overlayType) {
  return _.isObject(this.getOverlayByType(overlayType));
};

VizJSON.prototype.getOverlayByType = function (overlayType) {
  return _.find(this.overlays, function (overlay) {
    return overlay.type === overlayType;
  });
};

VizJSON.prototype.addHeaderOverlay = function (showTitle, showDescription, isShareable) {
  if (!this.hasOverlay(VizJSON.OVERLAY_TYPES.HEADER)) {
    this.overlays.unshift({
      type: VizJSON.OVERLAY_TYPES.HEADER,
      order: 1,
      shareable: isShareable,
      url: this.url,
      options: {
        extra: {
          title: this.title,
          description: this.description,
          show_title: showTitle,
          show_description: showDescription
        }
      }
    });
  }
};

VizJSON.prototype.addLayerSelectorOverlay = function () {
  if (!this.hasOverlay(VizJSON.OVERLAY_TYPES.LAYER_SELECTOR)) {
    this.overlays.push({
      type: VizJSON.OVERLAY_TYPES.LAYER_SELECTOR
    });
  }
};

VizJSON.prototype.addSearchOverlay = function () {
  if (!this.hasOverlay(VizJSON.OVERLAY_TYPES.SEARCH)) {
    this.overlays.push({
      type: VizJSON.OVERLAY_TYPES.SEARCH,
      order: 3
    });
  }
};

VizJSON.prototype.removeOverlay = function (overlayType) {
  for (var i = 0; i < this.overlays.length; ++i) {
    if (this.overlays[i].type === overlayType) {
      this.overlays.splice(i, 1);
      return;
    }
  }
};

VizJSON.prototype.removeLoaderOverlay = function () {
  this.removeOverlay(VizJSON.OVERLAY_TYPES.LOADER);
};

VizJSON.prototype.removeZoomOverlay = function () {
  this.removeOverlay(VizJSON.OVERLAY_TYPES.ZOOM);
};

VizJSON.prototype.removeSearchOverlay = function () {
  this.removeOverlay(VizJSON.OVERLAY_TYPES.SEARCH);
};

VizJSON.prototype._addAttributionOverlay = function () {
  this.overlays.push({
    type: VizJSON.OVERLAY_TYPES.ATTRIBUTION
  });
};

VizJSON.prototype.enforceGMapsBaseLayer = function (gmapsBaseType, gmapsStyle) {
  var isGmapsBaseTypeValid = _.contains(GMAPS_BASE_LAYER_TYPES, gmapsBaseType);
  if (this.map_provider === VizJSON.MAP_PROVIDER_TYPES.LEAFLET && isGmapsBaseTypeValid) {
    if (this.layers) {
      this.layers[0].options.type = 'GMapsBase';
      this.layers[0].options.base_type = gmapsBaseType;
      this.layers[0].options.name = gmapsBaseType;

      if (gmapsStyle) {
        this.layers[0].options.style = typeof gmapsStyle === 'string' ? JSON.parse(gmapsStyle) : gmapsStyle;
      }

      this.map_provider = VizJSON.GMAPS_BASE_LAYER_TYPES.GMAPS;
      this.layers[0].options.attribution = ''; // GMaps has its own attribution
    } else {
      log.error('No base map loaded. Using Leaflet.');
    }
  } else {
    log.error('GMaps base_type "' + gmapsBaseType + ' is not supported. Using leaflet.');
  }
};

VizJSON.prototype.setZoom = function (zoom) {
  this.zoom = zoom;
  this.bounds = null;
};

VizJSON.prototype.setCenter = function (center) {
  this.center = center;
  this.bounds = null;
};

VizJSON.prototype.setBounds = function (bounds) {
  this.bounds = bounds;
};

module.exports = VizJSON;
