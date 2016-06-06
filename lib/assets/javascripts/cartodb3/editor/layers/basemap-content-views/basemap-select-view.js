var cdb = require('cartodb.js');
var template = require('./basemap-select.tpl');
var MosaicFormView = require('../../../components/mosaic-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.filteredBasemapsCollection) throw new Error('filteredBasemapsCollection is required');
    if (!opts.selectedSourceVal) throw new Error('selectedSourceVal is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._filteredBasemapsCollection = opts.filteredBasemapsCollection;

    this._baseLayer = this._layerDefinitionsCollection.getBaseLayer();

    this._initBinds();
  },

  _initBinds: function () {
    this.add_related_model(this._filteredBasemapsCollection);
    this._baseLayer.bind('change', this._onChange.bind(this), this.model);
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

  _setBasemap: function (value) {
    var newBasemap = this._filteredBasemapsCollection.find(function (mdl) {
      return mdl.get('val') === value;
    });

    this._layerDefinitionsCollection.setBaseLayer(newBasemap.get('urlTemplate'));
  },

  _renderMosaic: function () {
    this._filteredBasemapsCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._setBasemap(value);
      }
    }, this);

    var view = new MosaicFormView({
      collection: this._filteredBasemapsCollection,
      template: require('./basemap-mosaic.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  }

});
