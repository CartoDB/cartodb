var BasemapMosaicView = require('./basemap-mosaic-view');
var BasemapMosaicModel = require('./basemap-mosaic-model');
var MosaicFormView = require('builder/components/mosaic-form-view');

/**
 *  Mosaic form view
 */

module.exports = MosaicFormView.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('Mosaic collection is required');
    if (!opts.template) throw new Error('template is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this.template = opts.template;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._modals = opts.modals;
    this._disabled = opts.disabled;
    this._currentTab = opts.currentTab;

    this._initBinds();
  },

  _initViews: function () {
    this.mosaic = new BasemapMosaicView({
      model: new BasemapMosaicModel(),
      collection: this.collection,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      customBaselayersCollection: this._customBaselayersCollection,
      modals: this._modals,
      disabled: this._disabled,
      currentTab: this._currentTab
    });
    this.mosaic.model.bind('change:highlightedAdd', this._onChangeHighlighted, this);

    if (!this.$('.js-selector').length) throw new Error('HTML element with js-selector class is required');

    this.$('.js-selector').append(this.mosaic.render().el);
    this.addView(this.mosaic);
  },

  _onChangeHighlighted: function () {
    var item = this.collection.getHighlighted() || this.mosaic.model.getHighlighted() || this.collection.getSelected();
    if (item) {
      var $el = this.$('.js-highlight');
      if ($el) {
        $el.text(item.getName());
      }
    }
  }

});
