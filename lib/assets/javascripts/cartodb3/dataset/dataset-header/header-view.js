var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');
var InlineEditorView = require('../../components/inline-editor/inline-editor-view');
var renameTableOperation = require('../operations/table-rename-operation');
var templateInlineEditor = require('./inline-editor.tpl');
var ConfirmationModalView = require('../../components/modals/confirmation/modal-confirmation-view');
var CreationModalView = require('../../components/modals/creation/modal-creation-view');
var templateConfirmation = require('./rename-confirmation-modal.tpl');
var createContextMenu = require('./create-context-menu');
var tableDuplicationOperation = require('../operations/table-duplication-operation');
var TITLE_SUFFIX = ' | CartoDB';
var DATASET_URL_PARAMETER = '/dataset/';

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  private: 'is-red'
};

module.exports = CoreView.extend({

  className: 'Editor-HeaderInfoEditor',

  events: {
    'click .js-options': '_showContextMenu'
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
        cssClass: PRIVACY_MAP[privacy.toLowerCase()],
        ago: moment(this._visModel.get('updated_at')).fromNow()
      })
    );

    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._visModel.bind('change:name', this._onChangeName, this);
    this._visModel.bind('change:privacy change:name', this.render, this);
    this.add_related_model(this._visModel);
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
  },

  _showContextMenu: function (ev) {
    var isTableOwner = this._tableModel.isOwner(this._userModel);
    var isLocked = !!this._syncModel.id;
    var triggerElementID = 'context-menu-trigger-' + this._tableModel.cid;
    this.$('.js-options').attr('id', triggerElementID);

    this._menuView = createContextMenu(ev, isTableOwner, isLocked, triggerElementID);
    this._menuView.bind('rename', function () {
      this._inlineEditor && this._inlineEditor.edit();
    }, this);
    // this._menuView.bind('delete', this._onDeleteClick, this);
    this._menuView.bind('duplicate', this._duplicateDataset, this);
    this._menuView.bind('lock', this._lockDataset, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _duplicateDataset: function () {
    var self = this;
    var tableName = this._tableModel.getUnquotedName();

    this._modals.create(function (modalModel) {
      return new CreationModalView({
        modalModel: modalModel,
        loadingTitle: _t('dataset.duplicate.loading', { tableName: tableName }),
        errorTitle: _t('dataset.duplicate.error', { tableName: tableName }),
        runAction: function (opts) {
          tableDuplicationOperation({
            query: self._querySchemaModel.get('query'),
            tableModel: self._tableModel,
            configModel: self._configModel,
            onSuccess: function (importModel) {
              var tableName = importModel.get('table_name');
              window.location = self._configModel.get('base_url') + DATASET_URL_PARAMETER + tableName;
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
              window.location = self._configModel.get('base_url');
            },
            error: function () {
              opts.error && opts.error();
            }
          });
        }
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

  _setDocumentTitle: function () {
    document.title = this._tableModel.get('name') + TITLE_SUFFIX;
  },

  _isEditable: function () {
    return !this._syncModel.id && this._tableModel.isOwner(this._userModel);
  }

});
