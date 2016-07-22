var CoreView = require('backbone/core-view');
var template = require('./basemap-select.tpl');
var MosaicFormView = require('../../../components/mosaic-form-view');
var BasemapMosaicFormView = require('./basemap-mosaic-form-view');
var BasemapFormView = require('./basemap-form-view');
var BasemapsCollection = require('./basemaps-collection');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');
    if (!opts.selectedCategoryVal) throw new Error('selectedCategoryVal is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._userLayersCollection = opts.userLayersCollection;
    this._selectedCategoryVal = opts.selectedCategoryVal;
    this._modals = opts.modals;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initCollection();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var cat = this._selectedCategoryVal.toLowerCase();

    switch (cat) {
      case 'color':
        this._renderForm();
        break;
      case 'custom':
        this._renderCustomMosaic();
        break;
      case 'mapbox':
        this._renderCustomMosaic(cat);
        break;
      default:
        this._renderMosaic();
    }

    return this;
  },

  _initCollection: function () {
    this._filteredBasemapsCollection = new BasemapsCollection(this._basemapsCollection.findByCategory(this._selectedCategoryVal), {
      parse: true
    });
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

    // this._basemapsCollection.updateSelected(basemap.getValue());
    this._layerDefinitionsCollection.setBaseLayer(basemap.toJSON());
  },

  _renderMosaic: function () {
    var view = new MosaicFormView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderCustomMosaic: function (cat) {
    var view = new BasemapMosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl'),
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      userLayersCollection: this._userLayersCollection,
      modals: this._modals,
      currentTab: cat
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderForm: function () {
    var view = new BasemapFormView({
      model: this._baseLayer,
      basemapsCollection: this._basemapsCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
