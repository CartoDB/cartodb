var template = require('builder/components/mosaic/mosaic.tpl');
var MosaicView = require('builder/components/mosaic/mosaic-view');
var MosaicItemModel = require('builder/components/mosaic/mosaic-item-model');
var BasemapMosaicItemView = require('./basemap-mosaic-item-view');
var MosaicAddItemView = require('./basemap-mosaic-add-item-view');

module.exports = MosaicView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._modals = opts.modals;
    this._disabled = opts.disabled;
    this._currentTab = opts.currentTab;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderList();
    this._createAddItem();
    return this;
  },

  _createItem: function (mdl) {
    var view = new BasemapMosaicItemView({
      model: mdl,
      disabled: this._disabled,
      basemapsCollection: this._basemapsCollection
    });
    this.$('.js-mosaic').append(view.render().el);
    this.addView(view);
  },

  _createAddItem: function () {
    var view = new MosaicAddItemView({
      model: new MosaicItemModel({
        label: 'Add',
        val: 'add',
        template: function () {
          return '<div class="Mosaic-button">+</div>';
        }
      }),
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      customBaselayersCollection: this._customBaselayersCollection,
      mosaicModel: this.model,
      modals: this._modals,
      currentTab: this._currentTab
    });
    this.$('.js-mosaic').append(view.render().el);
    this.addView(view);
  }

});
