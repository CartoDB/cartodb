var _ = require('underscore');
var log = require('cdb.log');
var View = require('../core/view');

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
  },

  render: function() {
    return this;
  },

  /**
  * add a infowindow to the map
  */
  addInfowindow: function(infoWindowView) {
    this.addOverlay(infoWindowView);
  },

  addOverlay: function(overlay) {
    if (overlay) {
      this.$el.append(overlay.render().el);
      this.addView(overlay);
    }
  },

  isMapAlreadyCreated: function() {
    return this.options.map_object;
  },

  /**
  * set model property but unbind changes first in order to not create an infinite loop
  */
  _setModelProperty: function(prop) {
    this._unbindModel();
    this.map.set(prop);
    if(prop.center !== undefined || prop.zoom !== undefined) {
      var b = this.getBounds();
      this.map.set({
        view_bounds_sw: b[0],
        view_bounds_ne: b[1]
      });
      if(this.autoSaveBounds) {
        this._saveLocation();
      }
    }
    this._bindModel();
  },

  /** bind model properties */
  _bindModel: function() {
    this._unbindModel();
    this.map.bind('change:view_bounds_sw',  this._changeBounds, this);
    this.map.bind('change:view_bounds_ne',  this._changeBounds, this);
    this.map.bind('change:zoom',            this._setZoom, this);
    this.map.bind('change:scrollwheel',     this._setScrollWheel, this);
    this.map.bind('change:keyboard',        this._setKeyboard, this);
    this.map.bind('change:center',          this._setCenter, this);
    this.map.bind('change:attribution',     this.setAttribution, this);
  },

  /** unbind model properties */
  _unbindModel: function() {
    this.map.unbind('change:view_bounds_sw',  null, this);
    this.map.unbind('change:view_bounds_ne',  null, this);
    this.map.unbind('change:zoom',            null, this);
    this.map.unbind('change:scrollwheel',     null, this);
    this.map.unbind('change:keyboard',        null, this);
    this.map.unbind('change:center',          null, this);
    this.map.unbind('change:attribution',     null, this);
  },

  _changeBounds: function() {
    var bounds = this.map.getViewBounds();
    if(bounds) {
      this.showBounds(bounds);
    }
  },

  showBounds: function(bounds) {
    this.map.fitBounds(bounds, this.getSize());
  },

  _addLayers: function(layerCollection, options) {
    var self = this;
    this._removeLayers();
    this.map.layers.each(function (layerModel) {
      self._addLayer(layerModel, layerCollection, {
        silent: (options && options.silent) || false,
        index: options && options.index
      });
    });
  },

  _addLayer: function(layerModel, layerCollection, options) {
    var layerView;
    if (layerModel.get('type').toLowerCase() === 'cartodb') {
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
      if (this._cartoDBLayerGroup.layers.size() === 0) {
        layerView.remove();
        this._cartoDBLayerGroupView = null;
      }
    } else {
      layerView.remove();
    }
    delete this._layerViews[layerModel.cid];
  },

  getLayerViewByLayerCid: function(cid) {
    var l = this._layerViews[cid];
    if(!l) {
      log.debug("layer with cid " + cid + " can't be get");
    }
    return l;
  },

  setAttribution: function() {
    throw new Error('Subclasses of src/geo/map-view.js must implement .setAttribution');
  },

  getNativeMap: function () {
    throw new Error('Subclasses of src/geo/map-view.js must implement .getNativeMap');
  },

  _addLayerToMap: function() {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._addLayerToMap');
  },

  _setZoom: function(model, z) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._setZoom');
  },

  _setCenter: function(model, center) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._setCenter');
  },

  _addGeomToMap: function(geom) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._addGeomToMap');
  },

  _removeGeomFromMap: function(geo) {
    throw new Error('Subclasses of src/geo/map-view.js must implement ._removeGeomFromMap');
  },

  setAutoSaveBounds: function() {
    this.autoSaveBounds = true;
  },

  _saveLocation: _.debounce(function() {
    this.map.save(null, { silent: true });
  }, 1000),

  _addGeometry: function(geom) {
    var view = this._addGeomToMap(geom);
    this.geometries[geom.cid] = view;
  },

  _removeGeometry: function(geo) {
    var geo_view = this.geometries[geo.cid];
    this._removeGeomFromMap(geo_view);
    delete this.geometries[geo.cid];
  }
});

module.exports = MapView;
