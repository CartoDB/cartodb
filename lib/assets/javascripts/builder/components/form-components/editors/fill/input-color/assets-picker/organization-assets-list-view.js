var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var AssetItemView = require('./asset-item-view');
var template = require('./organization-assets-list-view.tpl');

var REQUIRED_OPTS = [
  'userAssetCollection',
  'organizationAssetCollection',
  'selectedAsset'
];

var KIND = 'custom-marker';
var ASSET_HEIGHT = 48;

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    this._organizationAssetCollection.deselectAll();
    this._organizationAssetCollection.each(this._renderAsset, this);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._organizationAssetCollection, 'reset', this.render);
    this.listenTo(this._organizationAssetCollection, 'change', this._onChangeAssets);
  },

  _getSelectedAsset: function () {
    var selectedAssets = this._organizationAssetCollection.where({ state: 'selected' });
    return selectedAssets && selectedAssets[0];
  },

  _renderAsset: function (assetModel) {
    var assetItemView = new AssetItemView({
      model: assetModel,
      assetHeight: ASSET_HEIGHT,
      selectedAsset: this._selectedAsset
    });

    if (assetModel.get('public_url') === this.model.get('image')) {
      assetModel.set('state', 'selected');
    }

    assetItemView.bind('selected', this._selectAsset, this);

    this.$('.js-assets').append(assetItemView.render().el);
    this.addView(assetItemView);
  },

  _onChangeAssets: function () {
    var selectedAsset = this._getSelectedAsset();

    this._selectedAsset.set({
      url: selectedAsset && selectedAsset.get('public_url'),
      kind: KIND
    });
  },

  _selectAsset: function (m) {
    m.set('state', 'selected');

    this._organizationAssetCollection.deselectAll(m);
    this._userAssetCollection.deselectAll();
  }

});
