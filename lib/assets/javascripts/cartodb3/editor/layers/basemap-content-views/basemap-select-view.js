var cdb = require('cartodb.js');
var template = require('./basemap-select.tpl');
var MosaicCollection = require('../../../components/mosaic/mosaic-collection');
var MosaicFormView = require('../../../components/mosaic-form-view');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.selectedSource) throw new Error('selectedSource is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._selectedSource = opts.selectedSource;

    this._initCollection();
  },

  _initCollection: function () {
    this._filteredBasemaps = new MosaicCollection(
      _.map(this._getFilteredBasemaps(), function (basemap) {
        return {
          selected: this._layerDefinitionsCollection.getBaseLayer().get('urlTemplate') === basemap.get('urlTemplate'),
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
      return mdl.get('source') === self._selectedSource;
    });

    return filteredBasemaps;
  },

  _setBasemap: function (value) {
    var basemap = this._basemapsCollection.find(function (mdl) {
      return mdl.get('val') === value;
    });

    this._layerDefinitionsCollection.setBaseLayer(basemap.get('urlTemplate'));
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
