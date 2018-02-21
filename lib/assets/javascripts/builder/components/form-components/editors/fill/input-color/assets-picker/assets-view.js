var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var Backbone = require('backbone');

var Utils = require('builder/helpers/utils');
var MakiIcons = require('builder/components/form-components/editors/fill/input-color/assets/maki-icons');
var UserAssetsView = require('./user-assets-tab');
var OrganizationAssetsListView = require('./organization-assets-list-view');
var OrganizationAssetsCollection = require('builder/data/organization-assets-collection');
var UploadAssetsView = require('./upload-assets-tab');

var checkAndBuildOpts = require('builder/helpers/required-opts');
var AssetsCollection = require('builder/data/assets-collection');
var createTextLabelsTabPane = require('builder/components/tab-pane/create-text-labels-tab-pane');
var ScrollView = require('builder/components/scroll/scroll-view');
var AssetsListView = require('./assets-list-view');
var loadingView = require('builder/components/loading/render-loading');

var ErrorView = require('builder/components/error/error-view');
var errorTemplate = require('./upload-assets-error.tpl');
var errorParser = require('builder/helpers/error-parser');

var template = require('./assets-view.tpl');
var tabPaneTemplate = require('./tab-pane-template.tpl');

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
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      disclaimer: MakiIcons.disclaimer
    }));

    if (this._hasFetchedAllCollections()) {
      this._initTabPane();
    } else if (this._isLoading()) {
      this._renderLoading();
    } else if (this._hasError()) {
      this._renderError();
    }
    return this;
  },

  _hasFetchedAllCollections: function () {
    return this._stateModel.get('status') === 'show';
  },

  _initModels: function () {
    var self = this;

    this._selectedAsset = new Backbone.Model({
      url: this.model.get('image')
    });

    this._stateModel = new Backbone.Model({
      status: 'loading',
      modalEnabled: false,
      uploads: 0
    });

    this._assetCollections = [];

    this._userAssetCollection = new AssetsCollection(null, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._assetCollections.push(this._userAssetCollection);

    if (this._userModel.isInsideOrg()) {
      this._organizationAssetCollection = new OrganizationAssetsCollection(null, {
        configModel: this._configModel,
        orgId: this._userModel.getOrganization().get('id')
      });
      this._assetCollections.push(this._organizationAssetCollection);
    }

    var onFetchAssetCollections = _.invoke(this._assetCollections, 'fetch');
    $.when.apply($, onFetchAssetCollections)
      .then(function () {
        self._stateModel.set('status', 'show');
      }, function (model, response) {
        self._setError(response);
      });
  },

  _initBinds: function () {
    this.listenTo(this._selectedAsset, 'change:url', this._onChangeSelectedAsset);
    this.listenTo(this._stateModel, 'change:status', this.render);
    this.listenTo(this._stateModel, 'change:modalEnabled', this._onChangeSetButton);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this._stateModel.set('status', 'show');
    this._assetsTabPaneView.setSelectedTabPaneByName('upload-file');
  },

  _upload: function (data) {
    this._userAssetCollection.create(data, {
      beforeSend: this._beforeAssetUpload.bind(this),
      success: this._onAssetUploaded.bind(this),
      error: this._onAssetUploadError.bind(this),
      complete: this._onAssetUploadComplete.bind(this)
    });
  },

  _renderError: function () {
    this._hideDisclaimer();

    this.$('.js-body').html(
      new ErrorView({
        title: Utils.capitalize(this._stateModel.get('error_message')),
        desc: _t('components.modals.assets-picker.error-desc'),
        template: errorTemplate
      }).render().el
    );
  },

  _renderLoading: function () {
    this._hideDisclaimer();

    this.$('.js-body').html(
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
    var tabPaneTabs = [{
      name: 'maki-icons',
      label: _t('components.modals.add-asset.icons'),
      createContentView: this._createMakiIconsView.bind(this)
    }, {
      name: 'your-uploads',
      label: _t('components.modals.add-asset.your-uploads'),
      createContentView: this._createYourUploadsView.bind(this)
    }];

    if (this._userModel.isInsideOrg() && this._organizationAssetCollection.length > 0) {
      tabPaneTabs.push({
        name: 'organization-uploads',
        label: _t('components.modals.add-asset.organization-uploads'),
        createContentView: this._createOrganizationUploadsView.bind(this)
      });
    }

    tabPaneTabs.push({
      name: 'upload-file',
      label: _t('components.modals.add-asset.upload-file'),
      createContentView: this._createUploadFileView.bind(this)
    });

    var tabPaneOptions = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        disclaimer: MakiIcons.disclaimer,
        tabPaneItemOptions: {
          tagName: 'li',
          klassName: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    this._assetsTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.listenTo(this._assetsTabPaneView.collection, 'change', this._onChangeSelectedTab);

    this.addView(this._assetsTabPaneView);
    this.$('.js-body').append(this._assetsTabPaneView.render().el);

    this._initSetButtonState();
  },

  _onChangeSelectedTab: function () {
    switch (this._assetsTabPaneView.getSelectedTabPaneName()) {
      case 'maki-icons':
        this._setDisclaimer(MakiIcons.disclaimer);
        this._toggleSetButton();
        break;
      case 'upload-file':
        this._hideDisclaimer();
        this._disableSetButton();
        break;
      default:
        this._hideDisclaimer();
        this._toggleSetButton();
        break;
    }
  },

  _toggleSetButton: function () {
    this._stateModel.set('modalEnabled', this._selectedAsset.get('url') !== undefined);
  },

  _initSetButtonState: function () {
    if (!this.model.get('image')) {
      return;
    }

    var selectedAssetExist = false;

    if (this.model.get('kind') === 'marker') {
      selectedAssetExist = true;
    }

    if (!selectedAssetExist) {
      _.each(this._assetCollections, function (assetCollection) {
        if (!selectedAssetExist) {
          selectedAssetExist = assetCollection.some(function (mdl) {
            return this.model.get('image') === mdl.get('public_url');
          }, this);
        }
      }, this);
    }

    if (selectedAssetExist) {
      this._enableSetButton();
    }
  },

  _enableSetButton: function () {
    this._stateModel.set('modalEnabled', true);
  },

  _disableSetButton: function () {
    this._stateModel.set('modalEnabled', false);
  },

  _createYourUploadsView: function () {
    var view = new UserAssetsView({
      model: this.model,
      selectedAsset: this._selectedAsset,
      title: _t('components.modals.add-asset.your-uploads'),
      organizationAssetCollection: this._organizationAssetCollection,
      userAssetCollection: this._userAssetCollection,
      userModel: this._userModel
    }).bind(this);

    this._userAssetsView = view;

    view.bind('init-upload', this._initUpload, this);

    this._hideDisclaimer();

    return this._userAssetsView;
  },

  _createOrganizationUploadsView: function () {
    var view = new ScrollView({
      createContentView: function () {
        return new OrganizationAssetsListView({
          title: _t('components.modals.add-asset.organization-uploads'),
          model: this.model,
          organizationAssetCollection: this._organizationAssetCollection,
          userAssetCollection: this._userAssetCollection,
          selectedAsset: this._selectedAsset
        });
      }.bind(this)
    });

    this._hideDisclaimer();

    return view;
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

  _onUploadComplete: function () {
    this._assetsTabPaneView.setSelectedTabPaneByName('your-uploads');
  },

  _onChangeSetButton: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._stateModel.get('modalEnabled'));
  },

  _onChangeSelectedAsset: function () {
    if (!this._selectedAsset.get('url')) {
      this.model.unset('image');
      this.model.unset('kind');
    }

    this._stateModel.set('modalEnabled', !!this._selectedAsset.get('url'));
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

  _onAssetUploadError: function (model, response) {
    this._userAssetCollection.remove(model);
    this._resetFileSelection();
    this._setError(response);
  },

  _onAssetUploadComplete: function () {
    this._stateModel.set('uploads', this._stateModel.get('uploads') - 1);

    if (this._stateModel.get('uploads') < 1 && !this._hasError()) {
      this._stateModel.set('status', 'show');
      this._onUploadComplete();
    }
  },

  _resetFileSelection: function () {
    this.$('.js-fileInput').val('');
  },

  _onSetImage: function (e) {
    this.killEvent(e);

    if (!this._stateModel.get('modalEnabled')) {
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
