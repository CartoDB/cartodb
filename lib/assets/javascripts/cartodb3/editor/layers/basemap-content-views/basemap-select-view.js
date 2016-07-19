var CoreView = require('backbone/core-view');
var template = require('./basemap-select.tpl');
var MosaicFormView = require('../../../components/mosaic-form-view');
var BasemapMosaicFormView = require('./basemap-mosaic-form-view');
var BasemapFormView = require('./basemap-form-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.selectedCategoryVal) throw new Error('selectedCategoryVal is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._selectedCategoryVal = opts.selectedCategoryVal;
    this._modals = opts.modals;
    this._userLayersCollection = opts.userLayersCollection;

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
    this._filteredBasemapsCollection = this._userLayersCollection;
    // this._filteredBasemapsCollection = new MosaicCollection(
    //   _.map(this._getFilteredBasemaps(), function (basemap) {
    //     return {
    //       selected: basemap.get('selected'),
    //       val: basemap.get('val'),
    //       label: basemap.get('label'),
    //       template: basemap.get('template')
    //     };
    //   }, this)
    // );
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

  _getFilteredBasemaps: function () {
    var self = this;

    var filteredBasemaps = this._basemapsCollection.filter(function (mdl) {
      return mdl.get('category') === self._selectedCategoryVal;
    });

    return filteredBasemaps;
  },

  _changeBasemap: function (value) {
    var oldBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('selected');
    });
    oldBasemap && oldBasemap.set('selected', false);

    var newBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('val') === value;
    });
    newBasemap && newBasemap.set('selected', true);

    this._layerDefinitionsCollection.setBaseLayer(newBasemap.toJSON());
  },

  _renderMosaic: function () {
    var view = new MosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl'),
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderCustomMosaic: function (cat) {
    var view = new BasemapMosaicFormView({
      collection: this._userLayersCollection,
      template: require('./basemap-mosaic.tpl'),
      modals: this._modals,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      userLayersCollection: this._userLayersCollection,
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
