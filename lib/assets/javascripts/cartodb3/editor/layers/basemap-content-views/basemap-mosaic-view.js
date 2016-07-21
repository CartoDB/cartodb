var template = require('../../../components/mosaic/mosaic.tpl');
var MosaicView = require('../../../components/mosaic/mosaic-view');
var MosaicItemView = require('../../../components/mosaic/mosaic-item-view');
var MosaicItemModel = require('../../../components/mosaic/mosaic-item-model');
var MosaicAddItemView = require('./basemap-mosaic-add-item-view');

module.exports = MosaicView.extend({

  className: 'Mosaic',

  tagName: 'div',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.basemapsCollection) throw new Error('basemapsCollection is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._basemapsCollection = opts.basemapsCollection;
    this._userLayersCollection = opts.userLayersCollection;
    this._modals = opts.modals;
    this._currentTab = opts.currentTab;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderList();
    return this;
  },

  _renderList: function () {
    this.collection.each(function (mdl) {
      this._createItem(mdl);
    }, this);
    this._createAddItem();
  },

  _createAddItem: function () {
    var view = new MosaicAddItemView({
      model: new MosaicItemModel({
        label: 'Add',
        val: 'add',
        template: function () {
          return '+';
        }
      }),
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      basemapsCollection: this._basemapsCollection,
      userLayersCollection: this._userLayersCollection,
      mosaicModel: this.model,
      modals: this._modals,
      currentTab: this._currentTab
    });
    this.$('.js-mosaic').append(view.render().el);
    this.addView(view);
  },

  _createItem: function (mdl) {
    var view = new MosaicItemView({
      model: mdl
    });
    this.$('.js-mosaic').append(view.render().el);
    this.addView(view);
  }

});
