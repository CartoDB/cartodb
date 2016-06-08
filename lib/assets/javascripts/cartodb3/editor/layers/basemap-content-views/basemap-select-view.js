var CoreView = require('backbone/core-view');
var template = require('./basemap-select.tpl');
var MosaicFormView = require('../../../components/mosaic-form-view');
var MosaicCollection = require('../../../components/mosaic/mosaic-collection');
var _ = require('underscore-cdb-v3');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.selectedCategoryVal) throw new Error('selectedCategoryVal is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._selectedCategoryVal = opts.selectedCategoryVal;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initCollection();
    this._initBinds();
  },

  _initBinds: function () {
    this._baseLayer.bind('change', this._onChange.bind(this), this.model);
    this.add_related_model(this._baseLayer);
  },

  _onChange: function () {
    this._baseLayer.save();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._renderMosaic();

    return this;
  },

  _initCollection: function () {
    this._filteredBasemapsCollection = new MosaicCollection(
      _.map(this._getFilteredBasemaps(), function (basemap) {
        return {
          urlTemplate: basemap.get('urlTemplate'),
          selected: basemap.get('selected'),
          val: basemap.get('val'),
          label: basemap.get('label'),
          template: basemap.get('template')
        };
      }, this)
    );
  },

  _getFilteredBasemaps: function () {
    var self = this;

    var filteredBasemaps = this._basemapsCollection.filter(function (mdl) {
      return mdl.get('category') === self._selectedCategoryVal;
    });

    return filteredBasemaps;
  },

  _setBasemap: function (value) {
    var oldBasemap = this._basemapsCollection.findWhere({ selected: true });
    oldBasemap.set('selected', !oldBasemap.get('selected'));

    var newBasemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('val') === value;
    });
    newBasemap.set('selected', !newBasemap.get('selected'));

    this._layerDefinitionsCollection.setBaseLayer(newBasemap.get('urlTemplate'));
  },

  _renderMosaic: function () {
    this._filteredBasemapsCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._setBasemap(value);
      }
    }, this);
    this.add_related_model(this._filteredBasemapsCollection);

    var view = new MosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
