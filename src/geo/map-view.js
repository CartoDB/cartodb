var log = require('cdb.log');
var View = require('../core/view');
var GeometryViewFactory = require('./geometry-views/geometry-view-factory');

var MapView = View.extend({

  className: 'CDB-Map-wrapper',

  initialize: function () {
    // For debugging purposes
    window.mapView = this;

    this.options = this.options || {};
    if (this.options.map === undefined) throw new Error('map is required');
    if (this.options.layerGroupModel === undefined) throw new Error('layerGroupModel is required');

    this._cartoDBLayerGroup = this.options.layerGroupModel;
    this.map = this.options.map;
    this.add_related_model(this.map);

    this._cartoDBLayerGroupView = null;

    // A map of the LayerViews that is linked to each of the Layer models.
    // The cid of the layer model is used as the key for this mapping.
    this._layerViews = {};

    this._bindModel();

    this.map.layers.bind('reset', this._addLayers, this);
    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);

    // TODO: When this.map.layers get new indexes, something needs to happen
    this.add_related_model(this.map.layers);

    this.bind('clean', this._removeLayers, this);

    this.map.geometries.on('add', this._onGeometryAdded, this);
    this.add_related_model(this.map.geometries);
  },

  clean: function () {
    // remove layer views
    for (var layer in this._layerViews) {
      this._layerViews[layer].remove();
      delete this._layerViews[layer];
    }

    delete this._cartoDBLayerGroupView;

    View.prototype.clean.call(this);
  },

  render: function () {
    this._createNativeMap();
    this._setAttribution();
    var bounds = this.map.getViewBounds();
    if (bounds) {
      this._fitBounds(bounds);
    }
    this._addLayers();
    return this;
  },

  _onGeometryAdded: function (geometry) {
    var geometryView = GeometryViewFactory.createGeometryView(this.map.get('provider'), geometry, this);
    geometryView.render();
  },

  /**
  * set model property but unbind changes first in order to not create an infinite loop
  */
  _setModelProperty: function (prop) {
    this._unbindModel();
    this.map.set(prop);
    if (prop.center !== undefined || prop.zoom !== undefined) {
      var b = this.getBounds();
      this.map.set({
        view_bounds_sw: b[0],
        view_bounds_ne: b[1]
      });
    }
    this._bindModel();
  },

  /** bind model properties */
  _bindModel: function () {
    this._unbindModel();
    this.map.bind('change:view_bounds_sw', this._changeBounds, this);
    this.map.bind('change:view_bounds_ne', this._changeBounds, this);
    this.map.bind('change:zoom', this._setZoom, this);
    this.map.bind('change:scrollwheel', this._setScrollWheel, this);
    this.map.bind('change:keyboard', this._setKeyboard, this);
    this.map.bind('change:center', this._setCenter, this);
    this.map.bind('change:attribution', this._setAttribution, this);
  },

  /** unbind model properties */
  _unbindModel: function () {
    this.map.unbind('change:view_bounds_sw', null, this);
    this.map.unbind('change:view_bounds_ne', null, this);
    this.map.unbind('change:zoom', null, this);
    this.map.unbind('change:scrollwheel', null, this);
    this.map.unbind('change:keyboard', null, this);
    this.map.unbind('change:center', null, this);
    this.map.unbind('change:attribution', null, this);
  },

  _changeBounds: function () {
    var bounds = this.map.getViewBounds();
    if (bounds) {
      this._fitBounds(bounds);
    }
  },

  _fitBounds: function (bounds) {
    this.map.fitBounds(bounds, this.getSize());
  },

  _addLayers: function (layerCollection, options) {
    var self = this;
    this._removeLayers();
    this.map.layers.each(function (layerModel) {
      self._addLayer(layerModel, layerCollection, {
        silent: (options && options.silent) || false,
        index: options && options.index
      });
    });
  },

  _addLayer: function (layerModel, layerCollection, options) {
    var layerView;
    if (layerModel.get('type') === 'CartoDB') {
      layerView = this._addGroupedLayer(layerModel);
    } else {
      layerView = this._addIndividualLayer(layerModel);
    }

    if (!layerView) {
      return;
    }
    this._addLayerToMap(layerView, layerModel, {
      silent: options.silent,
      index: options.index
    });
  },

  _addGroupedLayer: function (layerModel) {
    // Layer group view already exists
    if (this._cartoDBLayerGroupView) {
      this._layerViews[layerModel.cid] = this._cartoDBLayerGroupView;
      return;
    }

    var layerView = this._createLayerView(this._cartoDBLayerGroup);
    this._cartoDBLayerGroupView = layerView;
    this._layerViews[layerModel.cid] = layerView;
    return layerView;
  },

  _addIndividualLayer: function (layerModel) {
    var layerView = this._createLayerView(layerModel);
    if (layerView) {
      this._layerViews[layerModel.cid] = layerView;
    }
    return layerView;
  },

  _createLayerView: function (layerModel) {
    return this._getLayerViewFactory().createLayerView(layerModel, this.getNativeMap());
  },

  _removeLayers: function () {
    for (var i in this._layerViews) {
      var layerView = this._layerViews[i];
      layerView.remove();
      delete this._layerViews[i];
    }
  },

  _removeLayer: function (layerModel) {
    var layerView = this._layerViews[layerModel.cid];
    if (layerModel.get('type') === 'CartoDB') {
      if (this.map.layers.getCartoDBLayers().length === 0) {
        layerView.remove();
        this._cartoDBLayerGroupView = null;
      }
    } else {
      layerView.remove();
    }
    delete this._layerViews[layerModel.cid];
  },

  getLayerViewByLayerCid: function (cid) {
    var l = this._layerViews[cid];
    if (!l) {
      log.debug('layer with cid ' + cid + " can't be get");
    }
    return l;
  },

  setCursor: function () {
    throw new Error('subclasses of MapView must implement setCursor');
  },

  addMarker: function (marker) {
    throw new Error('subclasses of MapView must implement addMarker');
  },

  removeMarker: function (marker) {
    throw new Error('subclasses of MapView must implement removeMarker');
  },

  hasMarker: function (marker) {
    throw new Error('subclasses of MapView must implement hasMarker');
  },

  addPath: function (path) {
    throw new Error('subclasses of MapView must implement addPath');
  },

  removePath: function (path) {
    throw new Error('subclasses of MapView must implement removePath');
  },

  // returns { x: 100, y: 200 }
  latLngToContainerPoint: function (latlng) {
    throw new Error('subclasses of MapView must implement latLngToContainerPoint');
  },

  // returns { lat: 0, lng: 0}
  containerPointToLatLng: function (point) {
    throw new Error('subclasses of MapView must implement containerPointToLatLng');
  },

  _setAttribution: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement _setAttribution');
  },

  getNativeMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement getNativeMap');
  },

  _getLayerViewFactory: function () {
    throw new Error('subclasses of MapView must implement _getLayerViewFactory');
  },

  _addLayerToMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement _addLayerToMap');
  },

  _setZoom: function (model, z) {
    throw new Error('Subclasses of src/geo/map-view.js must implement _setZoom');
  },

  _setCenter: function (model, center) {
    throw new Error('Subclasses of src/geo/map-view.js must implement _setCenter');
  },

  _addGeomToMap: function (geom) {
    throw new Error('Subclasses of src/geo/map-view.js must implement _addGeomToMap');
  },

  _removeGeomFromMap: function (geo) {
    throw new Error('Subclasses of src/geo/map-view.js must implement _removeGeomFromMap');
  },

  _createNativeMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement _createNativeMap');
  }
});

module.exports = MapView;
