var CoreView = require('backbone/core-view');
var template = require('./dataset-header.tpl');
var moment = require('moment');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var renameTableOperation = require('builder/dataset/operations/table-rename-operation');
var templateInlineEditor = require('./inline-editor.tpl');
var ConfirmationModalView = require('builder/components/modals/confirmation/modal-confirmation-view');
var RemoveDatasetModalView = require('builder/components/modals/remove-dataset/remove-dataset-view');
var PublishView = require('builder/components/modals/publish/publish-view');
var PrivacyDropdown = require('builder/components/privacy-dropdown/privacy-dropdown-view');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var CreatePrivacyOptions = require('builder/components/modals/publish/create-privacy-options');
var ShareWith = require('builder/components/modals/publish/share-with-view');
var CreationModalView = require('builder/components/modals/creation/modal-creation-view');
var EditMetadataView = require('builder/components/modals/dataset-metadata/dataset-metadata-view');
var VisTableModel = require('builder/data/visualization-table-model');
var templateConfirmation = require('./rename-confirmation-modal.tpl');
var createContextMenu = require('./create-context-menu');
var tableDuplicationOperation = require('builder/dataset/operations/table-duplication-operation');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TITLE_SUFFIX = ' | CARTO';

var PRIVACY_MAP = {
  public: 'green',
  link: 'orange',
  private: 'red'
};

var REQUIRED_OPTS = [
  'analysisDefinitionNodeModel',
  'configModel',
  'layerDefinitionModel',
  'modals',
  'router',
  'userModel',
  'visModel'
];

module.exports = CoreView.extend({

  className: 'Editor-HeaderInfoEditor',

  events: {
    'click .js-options': '_showContextMenu'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var privacyOptions = CreatePrivacyOptions(this._visModel, this._userModel);
    this._querySchemaModel = this._analysisDefinitionNodeModel.querySchemaModel;
    this._tableModel = this._analysisDefinitionNodeModel.getTableModel();
    this._syncModel = this._tableModel.getSyncModel();
    this._privacyCollection = new PrivacyCollection(privacyOptions);

    this._setDocumentTitle();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var privacy = this._visModel.get('privacy');

    this.$el.html(
      template({
        title: this._tableModel.getUnqualifiedName(),
        privacy: privacy,
        isOwner: this._isDatasetOwner(),
        isCustomQueryApplied: this._isCustomQueryApplied(),
        isSync: this._tableModel.isSync(),
        syncState: this._syncModel.get('state'),
        cssClass: PRIVACY_MAP[privacy.toLowerCase()],
        ago: moment(this._visModel.get('updated_at')).fromNow(),
        avatar: this._userModel.get('avatar_url'),
        isInsideOrg: this._userModel.isInsideOrg(),
        hasWriteAccess: this._hasWriteAccess()
      })
    );

    this._initViews();

    return this;
  },

  _hasWriteAccess: function () {
    var permissionModel = this._tableModel._permissionModel;

    return permissionModel.isOwner(this._userModel) || permissionModel.hasWriteAccess(this._userModel);
  },

  _initBinds: function () {
    this.listenTo(this._syncModel, 'change:state change:interval destroy', this.render);
    this.listenTo(this._visModel, 'change:name', this._onChangeName);
    this.listenTo(this._visModel, 'change:privacy change:name', this.render);
    this.listenTo(this._querySchemaModel, 'change:query', this.render);
  },

  _initViews: function () {
    var isDatasetOwner = this._isDatasetOwner();

    var toggleMenuTooltip = new TipsyTooltipView({
      el: this.$('.js-toggle'),
      gravity: 'w',
      title: function () {
        return this._isHidden() ? _t('editor.layers.options.show') : _t('editor.layers.options.hide');
      }.bind(this)
    });
    this.addView(toggleMenuTooltip);

    if (isDatasetOwner) {
      if (this._tableModel.isSync()) {
        var syncTooltip = new TipsyTooltipView({
          el: this.$('.js-syncState'),
          gravity: 'n',
          title: function () {
            return this._getSyncInfo();
          }.bind(this)
        });
        this.addView(syncTooltip);
      } else if (!this._isSample() && !this._isSubscription()) {
        this._inlineEditor = new InlineEditorView({
          template: templateInlineEditor,
          renderOptions: {
            name: this._tableModel.getUnqualifiedName()
          },
          onEdit: this._onRenameTable.bind(this)
        });

        this.$('.js-name').html(this._inlineEditor.render().el);
        this.addView(this._inlineEditor);
      }

      if (this._userModel.isInsideOrg() && !this._isSample() && !this._isSubscription()) {
        var shareWith = new ShareWith({
          visDefinitionModel: this._visModel,
          userModel: this._userModel,
          separationClass: 'u-rSpace--m',
          clickPrivacyAction: this._clickPrivacy.bind(this)
        });
        this.$('.js-share-users').append(shareWith.render().el);
        this.addView(shareWith);
      }
    }

    if (!this._isSample() && !this._isSubscription()) {
      var privacyDropdown = new PrivacyDropdown({
        privacyCollection: this._privacyCollection,
        visDefinitionModel: this._visModel,
        userModel: this._userModel,
        configModel: this._configModel,
        isOwner: isDatasetOwner,
        ownerName: !isDatasetOwner && this._tableModel.getOwnerName()
      });

      this.$('.js-dropdown').append(privacyDropdown.render().el);
      this.addView(privacyDropdown);
    }
  },

  _showContextMenu: function (ev) {
    var isSync = this._tableModel.isSync();
    var triggerElementID = 'context-menu-trigger-' + this._tableModel.cid;
    this.$('.js-options').attr('id', triggerElementID);

    if (this._menuView && this._menuView.isVisible()) {
      this._menuView.hide();
      this._menuView.clean();
      delete this._menuView;
      return;
    }

    this._menuView = createContextMenu({
      ev: ev,
      isTableOwner: this._isDatasetOwner(),
      isCustomQuery: this._isCustomQueryApplied(),
      isSample: this._isSample(),
      isSubscription: this._isSubscription(),
      isSync: isSync,
      triggerElementID: triggerElementID,
      canCreateDatasets: this._userModel.canCreateDatasets()
    });
    this._menuView.bind('rename', function () {
      this._inlineEditor && this._inlineEditor.edit();
    }, this);
    this._menuView.bind('delete', this._deleteDataset, this);
    this._menuView.bind('duplicate', this._duplicateDataset, this);
    this._menuView.bind('lock', this._lockDataset, this);
    this._menuView.bind('metadata', this._metadataDataset, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _deleteDataset: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new RemoveDatasetModalView({
        modalModel: modalModel,
        userModel: self._userModel,
        visModel: self._visModel,
        tableModel: self._tableModel,
        configModel: self._configModel
      });
    });
  },

  _duplicateDataset: function () {
    var self = this;
    var tableName = this._tableModel.getUnquotedName();
    var name = this._isCustomQueryApplied() ? _t('dataset.duplicate.query') : tableName;

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('dataset.duplicate.loading', { name: name }),
        errorTitle: _t('dataset.duplicate.error', { name: name }),
        runAction: function (opts) {
          tableDuplicationOperation({
            query: self._querySchemaModel.get('query'),
            tableModel: self._tableModel,
            configModel: self._configModel,
            onSuccess: function (importModel) {
              var tableName = importModel.get('table_name');
              var visTableModel = new VisTableModel({
                id: tableName,
                table: {
                  name: tableName
                }
              }, {
                configModel: self._configModel
              });

              window.location = visTableModel.datasetURL();
            },
            onError: function (importModel) {
              var error = importModel.get('get_error_text');
              var errorMessage = error && error.title;
              opts.error && opts.error(errorMessage);
            }
          });
        }
      });
    }, {
      escapeOptionsDisabled: true
    });
  },

  _lockDataset: function () {
    var self = this;
    var tableName = this._tableModel.getUnquotedName();

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('dataset.lock.loading', { tableName: tableName }),
        errorTitle: _t('dataset.lock.error', { tableName: tableName }),
        runAction: function (opts) {
          self._visModel.save({
            locked: true
          }, {
            wait: true,
            success: function () {
              window.location = self._configModel.get('base_url') + '/dashboard/datasets';
            },
            error: function () {
              opts.error && opts.error();
            }
          });
        }
      });
    });
  },

  _metadataDataset: function () {
    var isLocked = this._tableModel.isSync();
    var self = this;
    this._modals.create(function (modalModel) {
      return new EditMetadataView({
        modalModel: modalModel,
        visDefinitionModel: self._visModel,
        configModel: self._configModel,
        isLocked: isLocked
      });
    });
  },

  _onRenameTable: function (newName) {
    var self = this;
    this._inlineEditor.hide();

    if (newName === this._visModel.get('name')) {
      return;
    }

    this._modals.create(function (modalModel) {
      return new ConfirmationModalView({
        modalModel: modalModel,
        template: templateConfirmation,
        renderOpts: {
          tableName: self._visModel.get('name')
        },
        runAction: function () {
          modalModel.destroy();

          renameTableOperation({
            visModel: self._visModel,
            newName: newName,
            onError: self._onRenameFailed.bind(self)
          });
        }
      });
    });
  },

  _onRenameFailed: function () {
    this._visModel.set('name', this._visModel.previous('name'), { silent: true });
    this.render();
  },

  _onChangeName: function () {
    var name = this._visModel.get('name');
    this._analysisDefinitionNodeModel.setTableName(name);

    this._setDocumentTitle();

    this._layerDefinitionModel.save({
      sql: this._analysisDefinitionNodeModel.getDefaultQuery()
    });

    this._router.navigate(name, {
      replace: true
    });
  },

  _getSyncInfo: function () {
    var state = this._syncModel.get('state');
    if (state === 'success') {
      return _t('dataset.sync.synced', { ranAt: moment(this._syncModel.get('ran_at') || new Date()).fromNow() });
    } else if (state === 'failure') {
      var errorCode = this._syncModel.get('error_code');
      var errorMessage = this._syncModel.get('error_message');
      return _t('dataset.sync.error-code', { errorCode: errorCode }) + ':' + errorMessage;
    } else {
      return _t('dataset.sync.syncing');
    }
  },

  _clickPrivacy: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PublishView({
        mapcapsCollection: self._mapcapsCollection,
        modalModel: modalModel,
        visDefinitionModel: self._visModel,
        privacyCollection: self._privacyCollection,
        userModel: self._userModel,
        configModel: self._configModel,
        mode: 'share',
        isOwner: self._isDatasetOwner()
      });
    });
  },

  _setDocumentTitle: function () {
    document.title = this._tableModel.get('name') + TITLE_SUFFIX;
  },

  _isCustomQueryApplied: function () {
    return this._analysisDefinitionNodeModel.isCustomQueryApplied();
  },

  _isEditable: function () {
    return !this._analysisDefinitionNodeModel.isReadOnly();
  },

  _isDatasetOwner: function () {
    return this._tableModel.isOwner(this._userModel);
  },

  _isSample: function () {
    var sample = this._visModel.get('sample');
    return sample && !!sample.entity_id || false;
  },

  _isSubscription: function () {
    var subscription = this._visModel.get('subscription');
    return subscription && !!subscription.entity_id || false;
  }
});
