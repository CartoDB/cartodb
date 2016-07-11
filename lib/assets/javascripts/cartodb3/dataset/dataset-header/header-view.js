var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');
var InlineEditorView = require('../../components/inline-editor/inline-editor-view');
var TipsyTooltipView = require('../../components/tipsy-tooltip-view');
var renameTableOperation = require('../operations/table-rename-operation');
var templateInlineEditor = require('./inline-editor.tpl');
var ConfirmationModalView = require('../../components/modals/confirmation/modal-confirmation-view');
var PrivacyView = require('../../components/modals/privacy/privacy-view');
var PrivacyCollection = require('../../components/modals/privacy/privacy-collection');
var CreatePrivacyOptions = require('../../components/modals/privacy/create-privacy-options');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var EditMetadataView = require('../../components/modals/dataset-metadata/dataset-metadata-view');
var VisTableModel = require('../../data/visualization-table-model');
var templateConfirmation = require('./rename-confirmation-modal.tpl');
var templateDeletion = require('./delete-dataset-confirmation.tpl');
var createContextMenu = require('./create-context-menu');
var tableDuplicationOperation = require('../operations/table-duplication-operation');
var tableDeleteOperation = require('../operations/table-delete-operation');
var TITLE_SUFFIX = ' | CartoDB';

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  private: 'is-red'
};

module.exports = CoreView.extend({

  className: 'Editor-HeaderInfoEditor',

  events: {
    'click .js-options': '_showContextMenu',
    'click .js-privacy': '_onPrivacyClick'
  },

  initialize: function (opts) {
    if (!opts.router) throw new Error('router is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._tableModel = opts.tableModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._querySchemaModel = opts.querySchemaModel;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;
    this._router = opts.router;

    var privacyOptions = CreatePrivacyOptions(this._visModel, this._userModel);
    this._privacyCollection = new PrivacyCollection(privacyOptions);

    this._setDocumentTitle();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var privacy = this._visModel.get('privacy');
    var isOwner = this._tableModel.isOwner(this._userModel);

    this.$el.html(
      template({
        title: this._tableModel.getUnqualifiedName(),
        privacy: privacy,
        isOwner: this._tableModel.isOwner(this._userModel),
        isCustomQueryApplied: this._isCustomQueryApplied(),
        privacyDOMElement: isOwner ? 'button' : 'span',
        isSync: this._syncModel.isSync(),
        syncState: this._syncModel.get('state'),
        cssClass: PRIVACY_MAP[privacy.toLowerCase()],
        ago: moment(this._visModel.get('updated_at')).fromNow()
      })
    );

    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._syncModel.bind('change:state change:interval', this.render, this);
    this.add_related_model(this._syncModel);
    this._visModel.bind('change:name', this._onChangeName, this);
    this._visModel.bind('change:privacy change:name', this.render, this);
    this.add_related_model(this._visModel);
    this._querySchemaModel.bind('change:query', this.render, this);
    this.add_related_model(this._querySchemaModel);
  },

  _initViews: function () {
    if (this._isEditable()) {
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

    if (this._syncModel.isSync() && this.$('.js-syncState').length) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-syncState'),
        gravity: 'n',
        title: function () {
          return this._getSyncInfo();
        }.bind(this)
      });
      this.addView(tooltip);
    }
  },

  _showContextMenu: function (ev) {
    var isTableOwner = this._tableModel.isOwner(this._userModel);
    var isLocked = this._syncModel.isSync();
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
      isTableOwner: isTableOwner,
      isCustomQuery: this._isCustomQueryApplied(),
      isLocked: isLocked,
      triggerElementID: triggerElementID
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
    var tableName = this._tableModel.getUnquotedName();

    this._modals.create(function (modalModel) {
      return new ConfirmationModalView({
        modalModel: modalModel,
        template: templateDeletion,
        loadingTitle: _t('dataset.delete.loading', { tableName: tableName }),
        renderOpts: {
          tableName: tableName
        },
        runAction: function () {
          tableDeleteOperation({
            onSuccess: self._onSuccessDestroyDataset.bind(self, modalModel),
            onError: self._onErrorDestroyDataset.bind(self, modalModel),
            visModel: self._visModel
          });
        }
      });
    });
  },

  _onSuccessDestroyDataset: function (modalModel) {
    window.location = this._configModel.get('base_url') + '/dashboard';
  },

  _onErrorDestroyDataset: function (modalModel) {
    modalModel.destroy();
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
              window.location = self._configModel.get('base_url') + '/dashboard';
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
    var isLocked = this._syncModel.isSync();
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
    this._setDocumentTitle();
    var name = this._visModel.get('name');
    this._tableModel.set('name', name);
    this._router.navigate(name, {
      replace: true
    });
  },

  _onPrivacyClick: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new PrivacyView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel,
        visDefinitionModel: self._visModel,
        privacyCollection: self._privacyCollection
      });
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

  _setDocumentTitle: function () {
    document.title = this._tableModel.get('name') + TITLE_SUFFIX;
  },

  _isCustomQueryApplied: function () {
    return this._querySchemaModel.get('query').toLowerCase() !== 'select * from ' + this._tableModel.getUnquotedName();
  },

  _isEditable: function () {
    return !this._syncModel.isSync() && this._tableModel.isOwner(this._userModel);
  }

});
