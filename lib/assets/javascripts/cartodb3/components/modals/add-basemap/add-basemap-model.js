var Backbone = require('backbone');
var XYZModel = require('./xyz/xyz-model.js');
var NASAModel = require('./nasa/nasa-model.js');
var MapboxModel = require('./mapbox/mapbox-model.js');
var TileJSONModel = require('./tile-json/tile-json-model.js');
var WMSModel = require('./wms/wms-model.js');

/**
 * Add basemap model
 */
module.exports = Backbone.Model.extend({
  defaults: {
    tabs: undefined,
    contentPane: 'tabs', // [tabs, loading, error]
    currentTab: 'xyz' // [xyz, wms, nasa, mapbox, tilejson]
  },

  initialize: function (attrs, opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._userLayersCollection = opts.userLayersCollection;
    this._currentTab = opts.currentTab;

    this._initTabs();
    this._initBinds();
  },

  activeTabModel: function () {
    return this.get('tabs').where({ name: this.get('currentTab') })[0];
  },

  canSaveBasemap: function () {
    return this.get('contentPane') === 'tabs' && this._layerToSave();
  },

  saveBasemap: function () {
    var self = this;

    this.set('contentPane', 'addingNewBasemap');

    var customLayerModel = this._layerToSave();
    var attrs = customLayerModel.getAttributes();

    if (this.activeTabModel().hasAlreadyAddedLayer(this._userLayersCollection)) {
      // update selected in basemaps collection
      this._basemapsCollection.updateSelected(attrs.className);

      // // update selected in userlayers
      // this._userLayersCollection.updateSelected(attrs.id);

      // update baselayer
      this._onBasemapSaved(attrs);
    } else {
      // Add to userLayers collection before saving, so save URL resolves to the expected endpoint
      this._userLayersCollection.add(customLayerModel);

      customLayerModel.save()
        .done(function () {
          // add in basemaps collection
          self._basemapsCollection.add(attrs, {
            parse: true
          });

          // update selected in basemaps collection
          self._basemapsCollection.updateSelected(attrs.className);

          // // update selected in userlayers
          // self._userLayersCollection.updateSelected(attrs.id);

          // update baselayer
          self._onBasemapSaved(attrs);
        })
        .fail(function () {
          // Cleanup, remove layer it could not be saved!
          self._userLayersCollection.remove(customLayerModel);
          self.set('contentPane', 'addBasemapFailed');
        });
    }
  },

  _onBasemapSaved: function (layerAttrs) {
    // Update baseLayer
    this._layerDefinitionsCollection.setBaseLayer(layerAttrs);

    this.trigger('saveBasemapDone');
  },

  _initTabs: function () {
    var tabs = new Backbone.Collection([
      new XYZModel(),
      new WMSModel({
        baseLayers: this._userLayersCollection
      }),
      new NASAModel(),
      new MapboxModel(),
      new TileJSONModel()
    ]);
    this.set({
      tabs: tabs,
      currentTab: this._currentTab || tabs.first().get('name')
    });
  },

  _initBinds: function () {
    this.get('tabs').each(function (tabModel) {
      tabModel.bind('saveBasemap', this.saveBasemap, this);
    }, this);
  },

  _layerToSave: function () {
    return this.activeTabModel().get('layer');
  }

});
