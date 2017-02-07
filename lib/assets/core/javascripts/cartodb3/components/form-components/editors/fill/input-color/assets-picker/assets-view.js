var _ = require('underscore');
var CoreView = require('backbone/core-view');
var Backbone = require('backbone');

var Utils = require('../../../../../../helpers/utils');
var MakiIcons = require('../assets/maki-icons');
var PinIcons = require('../assets/pin-icons');
var SimpleIcons = require('../assets/simple-icons');

var UserAssetsView = require('./user-assets-tab');
var UploadAssetsView = require('./upload-assets-tab');

var checkAndBuildOpts = require('../../../../../../helpers/required-opts');
var AssetsCollection = require('../../../../../../data/assets-collection');
var createTextLabelsTabPane = require('../../../../../../components/tab-pane/create-text-labels-tab-pane');
var ScrollView = require('../../../../../scroll/scroll-view');
var AssetsListView = require('./assets-list-view');
var loadingView = require('../../../../../loading/render-loading');
var ErrorView = require('../../../../../error/error-view');
var errorTemplate = require('./upload-assets-error.tpl');
var errorParser = require('../../../../../../helpers/error-parser');

var template = require('./assets-view.tpl');

var KIND = 'custom-marker';

var REQUIRED_OPTS = [
  'modalModel',
  'configModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onSetImage',
    'click .js-upload': '_initUpload',
    'change .js-fileInput': '_onFileSelected',
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initTabPane();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(this._assetsTabPaneView.render().el);

    if (this._isLoading()) {
      this._renderLoading();
    } else if (this._hasError()) {
      this._renderError();
    }

    if (this.model.get('image')) {
      this.$('.js-add').removeClass('is-disabled');
    }

    return this;
  },

  _initModels: function () {
    this._selectedAsset = new Backbone.Model({
      url: this.model.get('image')
    });

    this.add_related_model(this._selectedAsset);

    this._stateModel = new Backbone.Model({
      status: 'show',
      uploads: 0
    });

    this.add_related_model(this._stateModel);

    this._assetCollection = new AssetsCollection(
      null, {
        configModel: this._configModel,
        userModel: this._userModel
      }
    );
  },

  _initBinds: function () {
    this.listenTo(this._selectedAsset, 'change:url', this._onChangeSelectedAsset);
    this.listenTo(this._stateModel, 'change:status', this.render);
    this.listenTo(this._assetsTabPaneView.collection, 'change', this._onChangeSelectedTab);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this._stateModel.set('status', '');
  },

  _upload: function (data) {
    this._assetCollection.create(data, {
      beforeSend: this._beforeAssetUpload.bind(this),
      success: this._onAssetUploaded.bind(this),
      error: this._onAssetUploadError.bind(this),
      complete: this._onAssetUploadComplete.bind(this)
    });
  },

  _renderError: function () {
    this._hideDisclaimer();

    this.$('.js-content').html(
      new ErrorView({
        title: Utils.capitalize(this._stateModel.get('error_message')),
        desc: _t('components.modals.assets-picker.error-desc'),
        template: errorTemplate
      }).render().el
    );
  },

  _renderLoading: function () {
    this._hideDisclaimer();

    this.$('.js-content').html(
      loadingView({
        title: _t('components.modals.assets-picker.loading')
      })
    );
  },

  _isLoading: function () {
    return this._stateModel.get('status') === 'loading';
  },

  _hasError: function () {
    return this._stateModel.get('status') === 'error';
  },

  _initTabPane: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'maki-icons',
      label: _t('components.modals.add-asset.maki-icons'),
      createContentView: self._createMakiIconsView.bind(self)
    }, {
      name: 'simple-icons',
      label: _t('components.modals.add-asset.simple-icons'),
      createContentView: self._createSimpleIconsView.bind(self)
    }, {
      name: 'pin-icons',
      label: _t('components.modals.add-asset.pin-icons'),
      createContentView: self._createPinIconsView.bind(self)
    }, {
      name: 'your-uploads',
      label: _t('components.modals.add-asset.your-uploads'),
      createContentView: self._createYourUploadsView.bind(self)
    }, {
      name: 'upload-file',
      label: _t('components.modals.add-asset.upload-file'),
      createContentView: self._createUploadFileView.bind(self)
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: template,
        disclaimer: MakiIcons.disclaimer,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase Publish-modalLink'
      }
    };

    this._assetsTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.addView(this._assetsTabPaneView);
  },

  _onChangeSelectedTab: function () {
    switch (this._assetsTabPaneView.getSelectedTabPaneName()) {
      case 'simple-icons':
        this._setDisclaimer(SimpleIcons.disclaimer);
        break;
      case 'maki-icons':
        this._setDisclaimer(MakiIcons.disclaimer);
        break;
      case 'pin-icons':
        this._setDisclaimer(PinIcons.disclaimer);
        break;
      case 'upload-file':
        this._selectedAsset.set({
          url: '',
          kind: ''
        });
        this._hideDisclaimer();
        break;
      default:
        this._hideDisclaimer();
        break;
    }
  },

  _createYourUploadsView: function () {
    var view = new UserAssetsView({
      model: this.model,
      selectedAsset: this._selectedAsset,
      title: _t('components.modals.add-asset.your-uploads'),
      userModel: this._userModel,
      configModel: this._configModel
    }).bind(this);

    this._userAssetsView = view;

    view.bind('init-upload', this._initUpload, this);
    view.bind('error', this._onUserError, this);

    this._hideDisclaimer();

    return this._userAssetsView;
  },

  _createUploadFileView: function () {
    var view = new UploadAssetsView({
      model: this.model,
      userModel: this._userModel,
      configModel: this._configModel
    }).bind(this);

    view.bind('upload-complete', this._onUploadComplete, this);
    view.bind('upload-files', this._uploadFiles, this);
    view.bind('upload-url', this._uploadURL, this);
    return view;
  },

  _createSimpleIconsView: function () {
    return new ScrollView({
      createContentView: function () {
        return new AssetsListView({
          model: this.model,
          selectedAsset: this._selectedAsset,
          title: _t('components.modals.add-asset.simple-icons'),
          icons: SimpleIcons.icons,
          folder: 'simpleicon',
          kind: 'marker',
          size: ''
        });
      }.bind(this)
    });
  },

  _createMakiIconsView: function () {
    return new ScrollView({
      createContentView: function () {
        return new AssetsListView({
          model: this.model,
          selectedAsset: this._selectedAsset,
          title: _t('components.modals.add-asset.maki-icons'),
          icons: MakiIcons.icons,
          folder: 'maki-icons',
          kind: 'marker',
          size: '18'
        });
      }.bind(this)
    });
  },

  _createPinIconsView: function () {
    return new ScrollView({
      createContentView: function () {
        return new AssetsListView({
          model: this.model,
          selectedAsset: this._selectedAsset,
          title: _t('components.modals.add-asset.pin-icons'),
          icons: PinIcons.icons,
          folder: 'pin-maps',
          kind: 'marker',
          size: ''
        });
      }.bind(this)
    });
  },

  _onUploadComplete: function () {
    this._assetsTabPaneView.setSelectedTabPaneByName('your-uploads');
  },

  _onChangeSelectedAsset: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._selectedAsset.get('url'));
  },

  _initUpload: function (e) {
    this.killEvent(e);
    this.$('.js-fileInput').click();
  },

  _setDisclaimer: function (disclaimer) {
    this.$('.js-disclaimer').html(disclaimer);
  },

  _hideDisclaimer: function () {
    this.$('.js-disclaimer').html('');
  },

  _getSelectedFiles: function () {
    return this.$('.js-fileInput').prop('files');
  },

  _uploadURL: function (url) {
    this._upload({
      type: 'url',
      kind: KIND,
      url: url
    });
  },

  _uploadFiles: function (files) {
    _.each(files, function (file) {
      this._upload({
        kind: KIND,
        type: 'file',
        filename: file
      });
    }, this);
  },

  _onFileSelected: function () {
    this._uploadFiles(this._getSelectedFiles());
  },

  _beforeAssetUpload: function () {
    this._stateModel.set('uploads', this._stateModel.get('uploads') + 1);

    if (this._stateModel.get('uploads') > 0) {
      this._stateModel.set('status', 'loading');
    }
  },

  _onAssetUploaded: function (iconModel) {
    this._resetFileSelection();
  },

  _setError: function (error) {
    this._stateModel.set({
      error_message: errorParser(error),
      status: 'error'
    });
  },

  _onUserError: function (error) {
    this._setError(error);
  },

  _onAssetUploadError: function (model, response) {
    this._resetFileSelection();
    this._setError(response);
  },

  _onAssetUploadComplete: function () {
    this._stateModel.set('uploads', this._stateModel.get('uploads') - 1);

    if (this._stateModel.get('uploads') < 1 && !this._hasError()) {
      this._onUploadComplete();
      this._stateModel.set('status', '');
    }
  },

  _resetFileSelection: function () {
    this.$('.js-fileInput').val('');
  },

  _onSetImage: function (e) {
    this.killEvent(e);

    if (!this._selectedAsset.get('url')) {
      return;
    }

    this.model.set({
      image: this._selectedAsset.get('url'), // backend serves the url of the asset in `image`
      kind: this._selectedAsset.get('kind')
    });

    this.trigger('change', {
      url: this._selectedAsset.get('url'),
      kind: this._selectedAsset.get('kind')
    }, this);

    this._modalModel.destroy(this.model);
  }
});
