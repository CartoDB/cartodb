var Backbone = require('backbone');
var CustomLayerModel = require('../../../data/custom-layer-model');
var XYZModel = require('./xyz/xyz-model.js');

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
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._userLayersCollection = opts.userLayersCollection;

    this._initTabs();
    // this._initBinds();
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

    if (this.activeTabModel().hasAlreadyAddedLayer(this._userLayersCollection)) {
      this._onBasemapSaved(customLayerModel);
    } else {
      // Add to userLayers collection before saving, so save URL resolves to the expected endpoint
      this._userLayersCollection.add(customLayerModel);

      customLayerModel.save()
        .done(function () {
          self._onBasemapSaved(customLayerModel.getAttributes());
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
      new XYZModel()
      // new WMSModel({
      //   baseLayers: this.get('baseLayers')
      // }),
      // new NASAModel(),
      // new MapboxModel(),
      // new TileJSONModel()
    ]);
    this.set({
      tabs: tabs,
      currentTab: tabs.first().get('name')
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
