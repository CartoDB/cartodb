var template = require('../../../components/mosaic/mosaic.tpl');
var MosaicCollection = require('../../../components/mosaic/mosaic-collection');
var MosaicItemView = require('../../../components/mosaic/mosaic-item-view');
var MosaicAddItemView = require('./basemap-mosaic-add-item-view');
var MosaicItemModel = require('../../../components/mosaic/mosaic-item-model');
var MosaicView = require('../../../components/mosaic/mosaic-view');

module.exports = MosaicView.extend({

  className: 'Mosaic',

  tagName: 'div',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.userLayersCollection) throw new Error('userLayersCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._modals = opts.modals;
    this._userLayersCollection = opts.userLayersCollection;
    this._currentTab = opts.currentTab;

    if (!opts.collection) {
      if (!opts.options) throw new Error('options array {value, label} is required');

      this.collection = new MosaicCollection(opts.options);
    }
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
      modals: this._modals,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      userLayersCollection: this._userLayersCollection,
      currentTab: this._currentTab,
      mosaicModel: this.model
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
