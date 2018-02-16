var Backbone = require('backbone');
var XYZModel = require('./xyz/xyz-model');
var mosaicThumbnail = require('builder/components/mosaic/mosaic-thumbnail.tpl');
var MapboxModel = require('./mapbox/mapbox-model');
var WMSModel = require('./wms/wms-model');
var TileJSONModel = require('./tilejson/tilejson-model');
var NASAModel = require('./nasa/nasa-model');

/**
 * Add basemap model
 */
module.exports = Backbone.Model.extend({
  defaults: {
    tabs: undefined,
    contentPane: 'tabs', // [tabs, loading, error]
    currentTab: 'xyz' // [xyz, wms, nasa, mapbox, tilejson, nasa]
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

    this.set('contentPane', 'addingBasemap');

    var customBaselayerModel = this._layerToSave();
    var attrs = customBaselayerModel.getAttributes();

    if (this.activeTabModel().hasAlreadyAddedLayer(this._customBaselayersCollection)) {
      // update selected in basemaps collection
      this._basemapsCollection.updateSelected(attrs.className);
      // update category if needed in basemaps collection,
      // this is the case for mapbox basemaps which were stored without category in the editor
      this._basemapsCollection.updateCategory(attrs.className, attrs.category);

      // update baselayer
      this._onBasemapSaved(attrs);
    } else {
      // Add to customBaselayersCollection before saving, so save URL resolves to the expected endpoint
      this._customBaselayersCollection.add(customBaselayerModel);

      customBaselayerModel.save({}, {
        success: function (mdl, mdlAttrs) {
          var options = mdlAttrs.options;

          var name = options.name ? options.name : 'Custom basemap ' + mdlAttrs.order;
          var className = options.className;
          var urlTemplate = options.urlTemplate;

          // add in basemaps collection
          self._basemapsCollection.add({
            id: mdlAttrs.id,
            urlTemplate: urlTemplate,
            maxZoom: options.minZoom || 21,
            minZoom: options.minZoom || 0,
            name: name,
            className: className,
            attribution: options.attribution,
            category: options.category,
            tms: options.tms,
            type: options.type,
            val: className,
            label: name,
            template: function (imgURL) {
              return mosaicThumbnail({
                imgURL: imgURL
              });
            }
          });

          // update baselayer
          self._onBasemapSaved(attrs);
        },
        error: function () {
          // Cleanup, remove layer it could not be saved!
          self._customBaselayersCollection.remove(customBaselayerModel);
          self.set('contentPane', 'addBasemapFailed');
        }
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
      new MapboxModel(),
      new WMSModel(null, {
        customBaselayersCollection: this._customBaselayersCollection
      }),
      new TileJSONModel(),
      new NASAModel()
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
