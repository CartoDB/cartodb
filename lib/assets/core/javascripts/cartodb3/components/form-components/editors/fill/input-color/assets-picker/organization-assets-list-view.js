var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var AssetItemView = require('./asset-item-view');
var loadingView = require('../../../../../loading/render-loading');
var ErrorView = require('../../../../../error/error-view');
var errorTemplate = require('./upload-assets-error.tpl');
var template = require('./organization-assets-list-view.tpl');

var REQUIRED_OPTS = [
  'assetsCollection',
  'selectedAsset'
];

var KIND = 'custom-marker';
var ASSET_HEIGHT = 48;

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    if (this._isLoading()) {
      this._renderLoading();
    } else if (this._hasError()) {
      this._renderError();
    } else {
      this._assetsCollection.each(this._renderAsset, this);
    }

    return this;
  },

  _initModels: function () {
    this._stateModel = new Backbone.Model();
    this.add_related_model(this._stateModel);
  },

  _initBinds: function () {
    this.listenTo(this._stateModel, 'change:status', this.render);
    this.listenTo(this._assetsCollection, 'change', this._onChangeAssets);
  },

  _getSelectedAsset: function () {
    var selectedAssets = this._assetsCollection.where({ state: 'selected' });
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

    this._assetsCollection.deselectAll(m);
  },

  _isLoading: function () {
    return this._stateModel.get('status') === 'loading';
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _renderLoading: function () {
    this.$el.html(
      loadingView({
        title: _t('components.modals.assets-picker.loading')
      })
    );
  },

  _renderError: function () {
    this.$el.html(
      new ErrorView({
        title: this._stateModel.get('error_message'),
        desc: _t('components.modals.assets-picker.error-desc'),
        template: errorTemplate
      }).render().el
    );
  }
});
