var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var XYZModel = require('./xyz/xyz_model.js');
var WMSModel = require('./wms/wms_model.js');
var NASAModel = require('./nasa/nasa_model.js');
var MapboxModel = require('./mapbox/mapbox_model.js');
var TileJSONModel = require('./tile_json/tile_json_view_model.js');

/**
 * View model for the add-custom-basemap view
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    map: undefined,
    baseLayers: undefined,
    tabs: undefined,
    currentView: 'tabs',
    currentTab: 'xyz'
  },

  initialize: function(attrs) {
    this.elder('initialize');
    if (!attrs.map) throw new Error('map is required');
    if (!attrs.baseLayers) throw new Error('baseLayers is required');
    this._initTabs();
    this._initBinds();
  },

  activeTabModel: function() {
    return this.get('tabs').where({ name: this.get('currentTab') })[0];
  },

  canSaveBasemap: function() {
    return this.get('currentView') === 'tabs' && this._layerToSave();
  },

  saveBasemap: function() {
    if (!this.canSaveBasemap()) return;
    this.set('currentView', 'saving');

    var layer = this._layerToSave();
    if (this.activeTabModel().hasAlreadyAddedLayer(this.get('baseLayers'))) {
      this._onLayerSaved(layer);
    } else {
      // Add to baseLayers collection before saving, so save URL resolves to the expected endpoint.
      this.get('baseLayers').add(layer);

      var self = this;
      layer.save()
      .done(function() {
        self._onLayerSaved(layer);
      })
      .fail(function() {
        // Cleanup, remove layer it could not be saved!
        self.get('baseLayers').remove(layer);
        self.set('currentView', 'saveFail');
      });
    }
  },

  _onLayerSaved: function(layer) {
    var map = this.get('map');

    var clonedLayer = layer.clone();
    clonedLayer.unset('id');
    map.changeProvider('leaflet', clonedLayer);

    var bbox = layer.get('bounding_boxes');
    if (bbox && bbox.length === 4) {
      map.setBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
      ]);
    }

    this.set('currentView', 'saveDone');
  },

  _initTabs: function() {
    var tabs = new Backbone.Collection([
      new XYZModel(),
      new WMSModel({
        baseLayers: this.get('baseLayers')
      }),
      new NASAModel(),
      new MapboxModel(),
      new TileJSONModel()
    ]);
    this.set({
      tabs: tabs,
      currentTab: tabs.first().get('name')
    });
  },

  _initBinds: function() {
    this.get('tabs').each(function(tabModel) {
      tabModel.bind('saveBasemap', this.saveBasemap, this);
    }, this);
  },

  _layerToSave: function() {
    return this.activeTabModel().get('layer');
  }

});
