var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var AssetItemView = require('./asset-item-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var Backbone = require('backbone');
var loadingView = require('builder/components/loading/render-loading');
var AssetHeaderView = require('./asset-header-view');

var ErrorView = require('builder/components/error/error-view');
var errorTemplate = require('./upload-assets-error.tpl');
var template = require('./user-assets-list-view.tpl');

var REQUIRED_OPTS = [
  'userModel',
  'userAssetCollection',
  'selectedAsset'
];

var KIND = 'custom-marker';
var ASSET_HEIGHT = 48;

module.exports = CoreView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (this._userModel.isInsideOrg()) {
      if (!opts.organizationAssetCollection) throw new Error('organizationAssetCollection is required');

      this._organizationAssetCollection = opts.organizationAssetCollection;
    }

    this._stateModel = new Backbone.Model();

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
      assetsCollection: this._userAssetCollection
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

    this._userAssetCollection.deselectAll();
    this._userAssetCollection.each(this._renderAsset, this);
  },

  _renderAddButton: function () {
    var addAssetButton = new AssetItemView({
      model: new Backbone.Model({
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

  _initBinds: function () {
    this._keyDown = this._onKeyDown.bind(this);
    $(document).on('keydown', this._keyDown);

    this._keyUp = this._onKeyUp.bind(this);
    $(document).on('keyup', this._keyUp);

    this.listenTo(this._stateModel, 'change:status', this.render);
    this.listenTo(this._userAssetCollection, 'change', this._onChangeAssets);
  },

  _getSelectedAsset: function () {
    return this._userAssetCollection.findWhere({ state: 'selected' });
  },

  _getSelectedAssetsCount: function () {
    var selectedAssets = this._userAssetCollection.where({ state: 'selected' });
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
    this._stateModel.unset('status');
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
    this._userAssetCollection.selectAll();
  },

  _deselectAllAssets: function () {
    this._userAssetCollection.deselectAll();
  },

  _selectAsset: function (m) {
    if (this._shiftKeyPressed) {
      m.set('state', m.get('state') === 'selected' ? '' : 'selected');
    } else {
      m.set('state', 'selected');
    }

    if (!this._shiftKeyPressed) {
      this._userAssetCollection.deselectAll(m);

      if (this._userModel.isInsideOrg()) {
        this._organizationAssetCollection.deselectAll();
      }
    }
  },

  _removeSelectedAssetsFromView: function () {
    var selectedAssets = this._userAssetCollection.select(function (asset) {
      return asset.get('state') === 'selected';
    }, this);

    _.each(selectedAssets, function (asset) {
      this.$('#' + asset.get('id')).remove();
    }, this);
  },

  _removeSelectedAssets: function () {
    this._stateModel.set('status', 'loading');

    var selectedAssets = this._userAssetCollection.select(function (asset) {
      return asset.get('state') === 'selected';
    }, this);

    _.each(selectedAssets, function (asset) {
      asset.destroy({
        complete: this._onDestroyFinished.bind(this)
      });
    }, this);
  },

  _onDestroyFinished: function (response) {
    if (response.status === 200) {
      this._removeSelectedAssetsFromView();
      this._stateModel.unset('status');
      this._selectedAsset.unset('kind');
      this._selectedAsset.unset('url');
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
