var _ = require('underscore');
var log = require('cdb.log');
var View = require('../core/view');
var GeometryViewFactory = require('./geometry-views/geometry-view-factory');

var InfowindowModel = require('./ui/infowindow-model');
var InfowindowView = require('./ui/infowindow-view');
var InfowindowManager = require('../vis/infowindow-manager');

var TooltipModel = require('./ui/tooltip-model');
var TooltipView = require('./ui/tooltip-view');
var TooltipManager = require('../vis/tooltip-manager');

var MapCursorManager = require('../vis/map-cursor-manager');
var MapEventsManager = require('../vis/map-events-manager');
var GeometryManagementController = require('../vis/geometry-management-controller');

var MapView = View.extend({

  className: 'CDB-Map-wrapper',

  initialize: function (deps) {
    View.prototype.initialize.apply(this, arguments);

    // For debugging purposes
    window.mapView = this;

    if (!deps.mapModel) throw new Error('mapModel is required');
    if (!deps.visModel) throw new Error('visModel is required');
    if (!deps.layerGroupModel) throw new Error('layerGroupModel is required');

    this._mapModel = this.map = deps.mapModel;
    this._visModel = deps.visModel;
    this._cartoDBLayerGroup = deps.layerGroupModel;

    this.add_related_model(this.map);

    this._cartoDBLayerGroupView = null;

    // A map of the LayerViews that is linked to each of the Layer models.
    // The cid of the layer model is used as the key for this mapping.
    this._layerViews = {};

    this._bindModel();

    this.map.layers.bind('reset', this._addLayers, this);
    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);
    this.add_related_model(this.map.layers);

    this.map.geometries.on('add', this._onGeometryAdded, this);
    this.add_related_model(this.map.geometries);

    // Infowindows && Tooltips
    var infowindowModel = new InfowindowModel();
    var tooltipModel = new TooltipModel({
      offset: [4, 10]
    });
    this._infowindowView = new InfowindowView({
      model: infowindowModel,
      mapView: this
    });
    this._tooltipView = new TooltipView({
      model: tooltipModel,
      mapView: this
    });

    // Initialise managers
    this._infowindowManager = new InfowindowManager({
      visModel: this._visModel,
      mapModel: this._mapModel,
      tooltipModel: tooltipModel,
      infowindowModel: infowindowModel
    }, {
      showEmptyFields: this._visModel.get('showEmptyInfowindowFields')
    });
    this._tooltipManager = new TooltipManager({
      mapModel: this._mapModel,
      tooltipModel: tooltipModel,
      infowindowModel: infowindowModel
    });
    this._geometryManagementController = new GeometryManagementController(this, this._mapModel);
    this._mapCursorManager = new MapCursorManager({
      mapView: this,
      mapModel: this._mapModel
    });

    this._mapEventsManager = new MapEventsManager({
      mapModel: this._mapModel
    });

    this._linkMapHelpers();
  },

  clean: function () {
    this._removeLayers();

    delete this._cartoDBLayerGroupView;

    // Clean Infowindow and Tooltip views
    this._infowindowView.clean();
    this._tooltipView.clean();

    // Stop managers
    this._geometryManagementController.stop();
    this._infowindowManager.stop();
    this._tooltipManager.stop();
    this._mapCursorManager.stop();
    this._mapEventsManager.stop();

    this._unbindModel();

    View.prototype.clean.call(this);
  },

  render: function () {
    this._createNativeMap();
    this._addLayers();

    // Enable geometry management
    this._geometryManagementController.start();
    this.map.setMapViewSize(this.getSize());
    return this;
  },

  _linkMapHelpers: function () {
    this.map.setPixelToLatLngConverter(this.containerPointToLatLng.bind(this));
    this.map.setLatLngToPixelConverter(this.latLngToContainerPoint.bind(this));
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
    this.map.bind('change', this._setView, this);
    this.map.bind('change:scrollwheel', this._setScrollWheel, this);
    this.map.bind('change:keyboard', this._setKeyboard, this);
  },

  /** unbind model properties */
  _unbindModel: function () {
    this.map.unbind('change:view_bounds_sw', this._changeBounds, this);
    this.map.unbind('change:view_bounds_ne', this._changeBounds, this);
    this.map.unbind('change', this._setView, this);
    this.map.unbind('change:scrollwheel', this._setScrollWheel, this);
    this.map.unbind('change:keyboard', this._setKeyboard, this);
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
    this.map.layers.each(function (layerModel, index) {
      self._addLayer(layerModel, layerCollection, {
        silent: (options && options.silent) || false,
        index: index
      });
    });
  },

  _addLayer: function (layerModel, layerCollection, options) {
    options = options || {};

    var layerView;
    if (layerModel.get('type') === 'CartoDB') {
      layerView = this._addGroupedLayer(layerModel);
    } else {
      layerView = this._addIndividualLayer(layerModel);
    }

    if (!layerView) {
      return;
    }
    this._addLayerToMap(layerView);

    if (!options.silent) {
      this.trigger('newLayerView', layerView);
    }
  },

  _addGroupedLayer: function (layerModel) {
    // Layer group view already exists
    if (this._cartoDBLayerGroupView) {
      this._layerViews[layerModel.cid] = this._cartoDBLayerGroupView;
      return;
    }

    // Create the view that groups CartoDB layers
    this._cartoDBLayerGroupView = this._createLayerView(this._cartoDBLayerGroup);
    this._layerViews[layerModel.cid] = this._cartoDBLayerGroupView;

    // Render the infowindow and tooltip "overlays"
    this._infowindowView.render();
    this.$el.append(this._infowindowView.el);
    this._tooltipView.render();
    this.$el.append(this._tooltipView.el);

    // Start managers that should be bound to the CartoDB layer group view
    this._infowindowManager.start(this._cartoDBLayerGroupView);
    this._tooltipManager.start(this._cartoDBLayerGroupView);
    this._mapCursorManager.start(this._cartoDBLayerGroupView);
    this._mapEventsManager.start(this._cartoDBLayerGroupView);

    return this._cartoDBLayerGroupView;
  },

  _addIndividualLayer: function (layerModel) {
    var layerView = this._createLayerView(layerModel);
    if (layerView) {
      this._layerViews[layerModel.cid] = layerView;
    }
    return layerView;
  },

  _createLayerView: function (layerModel) {
    return this._getLayerViewFactory().createLayerView(layerModel, this.getNativeMap(), this.map);
  },

  _removeLayers: function () {
    var layerViews = _.uniq(_.values(this._layerViews));
    for (var i in layerViews) {
      var layerView = layerViews[i];
      layerView.remove();
    }
    this._layerViews = {};
  },

  _removeLayer: function (layerModel) {
    var layerView = this._layerViews[layerModel.cid];
    if (layerView) {
      if (layerModel.get('type') === 'CartoDB') {
        if (this.map.layers.getCartoDBLayers().length === 0) {
          layerView.remove();
          this._cartoDBLayerGroupView = null;
        }
      } else {
        layerView.remove();
      }
      delete this._layerViews[layerModel.cid];
    }
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

  getSize: function () {
    throw new Error('subclasses of MapView must implement getSize');
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
