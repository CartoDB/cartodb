var _ = require('underscore');
var log = require('cdb.log');
var View = require('../core/view');

var MyLeafletPointView = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.mapView) throw new Error('mapView is required');

    this.model = this.model || options.model;
    this.mapView = options.mapView;
    this.leafletMap = this.mapView._getNativeMap();

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.on('change:latlng', this._onLatlngChanged, this);

    this._marker = this._createMarker();
    this._marker.on('dragstart', this._onDragStart.bind(this));
    this._marker.on('drag', _.debounce(this._onDrag.bind(this), 10));
    this._marker.on('dragend', this._onDragEnd.bind(this));
  },

  _onDragStart: function () {
    this._isDragging = true;
  },

  _onDrag: function (event) {
    this.model.set('latlng', this._marker.getLatLng());
  },

  _onDragEnd: function () {
    this._isDragging = false;
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  _createMarker: function () {
    var markerOptions = {
      icon: L.icon({
        iconUrl: '/themes/img/default-marker-icon.png',
        iconAnchor: [11, 11]
      })
    };

    var isDraggable = this.model.get('draggable');
    if (isDraggable) {
      markerOptions.draggable = isDraggable;
    }
    return L.marker(this.model.get('latlng') || [0,0], markerOptions);
  },

  render: function () {
    this._marker.addTo(this.leafletMap);
  },

  _onLatlngChanged: function () {
    if (!this.isDragging()) {
      this._marker.setLatLng(this.model.get('latlng'));
    }
    this._updateModelsGeoJSON();
  },

  _updateModelsGeoJSON: function () {
    this.model.set({
      geojson: this._marker.toGeoJSON()
    });
  },

  _onRemoveTriggered: function () {
    this.leafletMap.removeLayer(this._marker);
    this.remove();
  }
});

var MyLeafletPathViewBase = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.mapView) throw new Error('mapView is required');

    this.model = this.model || options.model;
    this.mapView = options.mapView;
    this.leafletMap = this.mapView._getNativeMap();

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.points.on('change', this._onPointsChanged, this);
    this.model.points.on('add', this._onPointsAdded, this);

    this._geometry = this._createGeometry();
    this._markers = [];
    this._pointViews = {};
  },

  _createGeometry: function () {
    throw new Error('Subclasses of MyLeafletPathViewBase must implement _createGeometry');
  },

  render: function () {
    this._renderPoints();
    this._geometry.addTo(this.mapView._getNativeMap());
  },

  _renderPoints: function () {
    this.model.points.each(this._renderPoint, this);
  },

  _renderPoint: function (point) {
    var pointView = new MyLeafletPointView({
      model: point,
      mapView: this.mapView
    });
    this._pointViews[point.cid] = pointView;
    pointView.render();
  },

  _onPointsChanged: function () {
    this._updateGeometry();
    this._updateModelsGeoJSON();
  },

  _onPointsAdded: function () {
    var newPoints = this.model.points.select(function (point) {
      return !this._pointViews[point.cid];
    }, this);
    _.each(newPoints, this._renderPoint, this);
    this._updateGeometry();
    this._updateModelsGeoJSON();
  },

  _updateGeometry: function () {
    this._geometry.setLatLngs(this.model.getLatLngs());
  },

  _updateModelsGeoJSON: function () {
    this.model.set({
      geojson: this._geometry.toGeoJSON()
    });
  },

  _onRemoveTriggered: function () {
    this._removePoints();
    this.leafletMap.removeLayer(this._geometry);
    this.remove();
  },

  _removePoints: function () {
    this.model.points.each(function (point) {
      point.remove();
    }, this);
  }
});

var MyLeafletLineView = MyLeafletPathViewBase.extend({
  _createGeometry: function () {
    return L.polyline([], { color: 'red' });
  }
});

var MyLeafletPolygonView = MyLeafletPathViewBase.extend({
  _createGeometry: function () {
    return L.polygon([], { color: 'red' });
  }
});

var MapView = View.extend({
  initialize: function () {
    if (this.options.map === undefined) {
      throw new Error('you should specify a map model');
    }

    if (this.options.layerGroupModel === undefined) {
      throw new Error('layerGroupModel is required');
    }
    this._cartoDBLayerGroup = this.options.layerGroupModel;

    if (this.options.layerViewFactory === undefined) {
      throw new Error('you should specify a layerViewFactory');
    }

    this._cartoDBLayerGroupView = null;
    this.map = this.options.map;
    this.add_related_model(this.map);

    this._layerViewFactory = this.options.layerViewFactory;
    this.autoSaveBounds = false;

    // A map of the LayerViews that is linked to each of the Layer models.
    // The cid of the layer model is used as the key for this mapping.
    this._layerViews = {};
    this.geometries = {};

    this.map.layers.bind('reset', this._addLayers, this);
    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);

    // TODO: When this.map.layers get new indexes, something needs to happen
    this.add_related_model(this.map.layers);

    this.bind('clean', this._removeLayers, this);

    this.map.on('enterDrawingMode', this._enterDrawingMode, this);
    this.map.on('exitDrawingMode', this._exitDrawingMode, this);
  },

  _enterDrawingMode: function () {
    this.on('click', this._onMapClicked, this);
  },

  _exitDrawingMode: function () {
    this.off('click', this._onMapClicked, this);
    delete this._newGeometryView;
  },

  _onMapClicked: function (event, latlng) {
    var geometry = this.map.getNewGeometry();
    if (!this._isGeometryDrawn(geometry)) {
      this._drawGeometry(geometry);
    }
    geometry.update(latlng);
  },

  _isGeometryDrawn: function (geometry) {
    return !!this._newGeometryView;
  },

  _drawGeometry: function (geometry) {

    var GEOMETRY_VIEWS = {
      'point': MyLeafletPointView,
      'line': MyLeafletLineView,
      'polygon': MyLeafletPolygonView
    };

    var GeometryView = GEOMETRY_VIEWS[geometry.get('type')];
    if (GeometryView) {
      var geometryView = new GeometryView({
        model: geometry,
        mapView: this
      });
      this._newGeometryView = geometryView;
      geometryView.render();
    } else {
      throw new Error(geometry.get('type') + ' is not supported yet');
    }
  },







  render: function () {
    this._addLayers();
    return this;
  },

  /**
  * add a infowindow to the map
  */
  addInfowindow: function (infoWindowView) {
    this.addOverlay(infoWindowView);
  },

  addOverlay: function (overlay) {
    if (overlay) {
      this.$el.append(overlay.render().el);
      this.addView(overlay);
    }
  },

  isMapAlreadyCreated: function () {
    return this.options.map_object;
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
      if (this.autoSaveBounds) {
        this._saveLocation();
      }
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
    this.map.bind('change:attribution', this.setAttribution, this);
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
      this.showBounds(bounds);
    }
  },

  showBounds: function (bounds) {
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
    return this._layerViewFactory.createLayerView(layerModel, this.getNativeMap());
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

  setAttribution: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement .setAttribution');
  },

  getNativeMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement .getNativeMap');
  },

  _addLayerToMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._addLayerToMap');
  },

  _setZoom: function (model, z) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._setZoom');
  },

  _setCenter: function (model, center) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._setCenter');
  },

  _addGeomToMap: function (geom) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._addGeomToMap');
  },

  _removeGeomFromMap: function (geo) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._removeGeomFromMap');
  },

  setAutoSaveBounds: function () {
    this.autoSaveBounds = true;
  },

  _saveLocation: _.debounce(function () {
    this.map.save(null, { silent: true });
  }, 1000),

  _addGeometry: function (geom) {
    var view = this._addGeomToMap(geom);
    this.geometries[geom.cid] = view;
  },

  _removeGeometry: function (geo) {
    var geo_view = this.geometries[geo.cid];
    this._removeGeomFromMap(geo_view);
    delete this.geometries[geo.cid];
  }
});

module.exports = MapView;
