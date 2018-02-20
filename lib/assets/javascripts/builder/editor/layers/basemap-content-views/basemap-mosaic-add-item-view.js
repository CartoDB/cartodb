var CoreView = require('backbone/core-view');
var template = require('builder/components/mosaic/mosaic-item.tpl');
var AddBasemapView = require('builder/components/modals/add-basemap/add-basemap-view');
var AddBasemapModel = require('builder/components/modals/add-basemap/add-basemap-model');

module.exports = CoreView.extend({

  className: 'Mosaic-item Mosaic-item--dashed',

  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.mosaicModel) throw new Error('mosaicModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._modals = opts.modals;
    this._currentTab = opts.currentTab;
    this._mosaicModel = opts.mosaicModel;

    this.add_related_model(this._mosaicModel);
  },

  render: function () {
    this.$el.html(
      template({
        name: this.model.getName(),
        template: this.model.get('template')()
      })
    );
    return this;
  },

  _onMouseEnter: function () {
    this._mosaicModel.set('highlightedAdd', true);
  },

  _onMouseLeave: function () {
    this._mosaicModel.set('highlightedAdd', false);
  },

  _onClick: function () {
    var self = this;

    var modal = this._modals.create(function (modalModel) {
      var addBasemapModel = new AddBasemapModel({}, {
        layerDefinitionsCollection: self._layerDefinitionsCollection,
        basemapsCollection: self._basemapsCollection,
        customBaselayersCollection: self._customBaselayersCollection,
        currentTab: self._currentTab
      });

      return new AddBasemapView({
        modalModel: modalModel,
        createModel: addBasemapModel
      });
    }, {
      breadcrumbsEnabled: true
    });
    modal.show();
  }

});
