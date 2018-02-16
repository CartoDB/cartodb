var CoreView = require('backbone/core-view');
var template = require('./basemap-select.tpl');
var MosaicFormView = require('builder/components/mosaic-form-view');
var BasemapFormView = require('./basemap-form-view');
var MosaicCollection = require('builder/components/mosaic/mosaic-collection');
var BasemapMosaicFormView = require('./basemap-mosaic-form-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionsCollection',
  'basemapsCollection',
  'customBaselayersCollection',
  'selectedCategoryVal',
  'modals'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();
    this._disabled = opts.disabled;

    this._initCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var category = this._selectedCategoryVal.toLowerCase();

    switch (category) {
      case 'color':
        this._renderForm();
        break;
      case 'custom':
        this._renderCustomMosaic();
        break;
      case 'nasa':
      case 'tilejson':
      case 'mapbox':
      case 'wms':
        this._renderCustomMosaic(category);
        break;
      default:
        this._renderMosaic();
    }

    return this;
  },

  _initCollection: function () {
    this._filteredBasemapsCollection = new MosaicCollection(
      this._basemapsCollection.findByCategory(this._selectedCategoryVal)
    );
  },

  _initBinds: function () {
    this._filteredBasemapsCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._changeBasemap(value);
      }
    }, this);
    this.add_related_model(this._filteredBasemapsCollection);
  },

  _changeBasemap: function (value) {
    var basemap = this._basemapsCollection.getByValue(value);

    this._layerDefinitionsCollection.setBaseLayer(basemap.toJSON());
  },

  _renderMosaic: function () {
    var view = new MosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl'),
      disabled: this._disabled
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderCustomMosaic: function (category) {
    var view = new BasemapMosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl'),
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      customBaselayersCollection: this._customBaselayersCollection,
      modals: this._modals,
      disabled: this._disabled,
      currentTab: category
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderForm: function () {
    var view = new BasemapFormView({
      model: this._baseLayer,
      basemapsCollection: this._basemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      disabled: this._disabled
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
