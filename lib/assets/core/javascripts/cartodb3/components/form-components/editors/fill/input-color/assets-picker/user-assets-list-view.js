var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AssetItemView = require('./asset-item-view');
var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var Backbone = require('backbone');
var loadingView = require('../../../../../loading/render-loading');
var AssetHeaderView = require('./asset-header-view');

var ErrorView = require('../../../../../error/error-view');
var errorTemplate = require('./upload-assets-error.tpl');
var template = require('./user-assets-list-view.tpl');

var REQUIRED_OPTS = [
  'assets',
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
      this._renderRegularView();
    }

    return this;
  },

  _addHeaderView: function () {
    this._assetHeaderView = new AssetHeaderView({
      editable: true,
      title: this.options.title,
      assets: this._assets
    });

    this.addView(this._assetHeaderView);
    this.$('.js-nav').append(this._assetHeaderView.render().el);

    this._assetHeaderView.bind('select-all', this._selectAllAssets, this);
    this._assetHeaderView.bind('deselect-all', this._deselectAllAssets, this);
    this._assetHeaderView.bind('remove', this._removeSelectedAssets, this);
  },

  _renderRegularView: function () {
    this._addHeaderView();
    this._renderAddButton();
    this._assets.each(this._renderAsset, this);
  },

  _renderAddButton: function () {
    var addAssetButton = new AssetItemView({
      model: new cdb.core.Model({
        type: 'text',
        name: '+'
      }),
      assetHeight: ASSET_HEIGHT
    });

    addAssetButton.bind('selected', function () {
      this.trigger('init-upload');
    }, this);

    this.addView(addAssetButton);
    this.$('.js-assets').append(addAssetButton.render().$el);
  },

  _initModels: function () {
    this._stateModel = new Backbone.Model();
    this.add_related_model(this._stateModel);
  },

  _initBinds: function () {
    this._keyDown = this._onKeyDown.bind(this);
    $(document).on('keydown', this._keyDown);

    this._keyUp = this._onKeyUp.bind(this);
    $(document).on('keyup', this._keyUp);

    this._stateModel.on('change:status', this.render, this);
    this._assets.on('change', this._onChangeAssets, this);
  },

  _getSelectedAsset: function () {
    var selectedAssets = this._assets.where({ state: 'selected' });
    return selectedAssets && selectedAssets[0];
  },

  _getSelectedAssetsCount: function () {
    var selectedAssets = this._assets.where({ state: 'selected' });
    return selectedAssets ? selectedAssets.length : 0;
  },

  _onKeyDown: function (ev) {
    this._shiftKeyPressed = ev.shiftKey;
  },

  _onKeyUp: function (ev) {
    this._shiftKeyPressed = ev.shiftKey;
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this._stateModel.set('status', '');
  },

  _renderAsset: function (assetModel) {
    var assetItemView = new AssetItemView({
      model: assetModel,
      assetHeight: ASSET_HEIGHT,
      selectedAsset: this._selectedAsset
    });

    if (assetItemView.model.get('public_url') === this.model.get('image')) {
      assetItemView.model.set('state', 'selected');
    }

    assetItemView.bind('selected', this._selectAsset, this);

    this.$('.js-assets').append(assetItemView.render().el);
    this.addView(assetItemView);
  },

  _onChangeAssets: function () {
    if (this._getSelectedAssetsCount() === 1) {
      var selectedAsset = this._getSelectedAsset();
      this._selectedAsset.set({
        url: selectedAsset && selectedAsset.get('public_url'),
        kind: KIND
      });
    } else {
      this._selectedAsset.set({
        url: '',
        kind: ''
      });
    }
  },

  _selectAllAssets: function () {
    this._assets.each(function (assetModel) {
      assetModel.set('state', 'selected');
    });
  },

  _selectAsset: function (m) {
    if (this._shiftKeyPressed) {
      m.set('state', m.get('state') === 'selected' ? '' : 'selected');
    } else {
      m.set('state', 'selected');
    }

    if (!this._shiftKeyPressed) {
      this._deselectAllExceptSelected(m);
    }
  },

  _deselectAllExceptSelected: function (m) {
    this._assets.each(function (assetModel) {
      if (assetModel !== m && assetModel.get('state') === 'selected') {
        assetModel.set('state', '');
      }
    });
  },

  _deselectAllAssets: function () {
    this._assets.each(function (assetModel) {
      assetModel.set('state', '');
    });
  },

  _removeSelectedAssets: function () {
    this._stateModel.set('status', 'loading');

    var selectedAssets = this._assets.select(function (asset) {
      return asset.get('state') === 'selected';
    }, this);

    _.each(selectedAssets, function (asset) {
      asset.destroy({
        complete: this._onDestroyFinished.bind(this)
      });

      this.$('#' + asset.get('id')).remove();
    }, this);
  },

  _onDestroyFinished: function (response) {
    if (response.status === 200) {
      this._stateModel.set('status', '');
    } else {
      this._stateModel.set({
        error_message: response.statusText,
        status: 'error'
      });
    }
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
  },

  _disableBinds: function () {
    $(document).off('keydown', this._keyDown);
    $(document).off('keyup', this._keyUp);
  },

  clean: function () {
    this._disableBinds();
    CoreView.prototype.clean.apply(this);
  }
});
