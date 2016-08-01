var Backbone = require('backbone');
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
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._currentTab = opts.currentTab;

    this._initTabs();
    this._initBinds();
  },

  activeTabModel: function () {
    return this.get('tabs').findWhere({ name: this.get('currentTab') });
  },

  canSaveBasemap: function () {
    return this.get('contentPane') === 'tabs' && this._layerToSave();
  },

  saveBasemap: function () {
    var self = this;

    this.set('contentPane', 'addingNewBasemap');

    var customBaselayerModel = this._layerToSave();
    var attrs = customBaselayerModel.getAttributes();

    if (this.activeTabModel().hasAlreadyAddedLayer(this._customBaselayersCollection)) {
      // update selected in basemaps collection
      this._basemapsCollection.updateSelected(attrs.className);

      // // update selected in userlayers
      // this._customBaselayersCollection.updateSelected(attrs.id);

      // update baselayer
      this._onBasemapSaved(attrs);
    } else {
      // Add to userLayers collection before saving, so save URL resolves to the expected endpoint
      this._customBaselayersCollection.add(customBaselayerModel);

      customBaselayerModel.save()
        .done(function () {
          // add in basemaps collection
          self._basemapsCollection.add(attrs, {
            parse: true
          });

          // update selected in basemaps collection
          self._basemapsCollection.updateSelected(attrs.className);

          // // update selected in userlayers
          // self._customBaselayersCollection.updateSelected(attrs.id);

          // update baselayer
          self._onBasemapSaved(attrs);
        })
        .fail(function () {
          // Cleanup, remove layer it could not be saved!
          self._customBaselayersCollection.remove(customBaselayerModel);
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
