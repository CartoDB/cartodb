var cdb = require('cartodb.js');
var template = require('./basemap-select.tpl');
var MosaicCollection = require('../../../components/mosaic/mosaic-collection');
var MosaicFormView = require('../../../components/mosaic-form-view');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.selectedSourceVal) throw new Error('selectedSourceVal is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._selectedSourceVal = opts.selectedSourceVal;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initBinds();
    this._initCollection();
  },

  _initBinds: function () {
    this._baseLayer.bind('change', this._onChange.bind(this), this.model);
  },

  _onChange: function () {
    this._baseLayer.save();
  },

  _initCollection: function () {
    this._filteredBasemaps = new MosaicCollection(
      _.map(this._getFilteredBasemaps(), function (basemap) {
        return {
          selected: basemap.get('selected'),
          val: basemap.get('val'),
          label: basemap.get('label'),
          template: basemap.get('template')
        };
      }, this)
    );
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._renderMosaic();

    return this;
  },

  _getFilteredBasemaps: function () {
    var self = this;

    var filteredBasemaps = this._basemapsCollection.filter(function (mdl) {
      return mdl.get('source') === self._selectedSourceVal;
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
    this._filteredBasemaps.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._setBasemap(value);
      }
    }, this);

    var view = new MosaicFormView({
      collection: this._filteredBasemaps,
      template: require('./basemap-mosaic.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
