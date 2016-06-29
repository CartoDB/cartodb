var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');
var InlineEditorView = require('../components/inline-editor/inline-editor-view');
var renameTableOperation = require('./table-rename-operation');
var templateInlineEditor = require('./inline-editor.tpl');
var ConfirmationModalView = require('../components/modals/confirmation/modal-confirmation-view');
var templateConfirmation = require('./rename-confirmation-modal.tpl');
var TITLE_SUFFIX = ' | CartoDB';

var PRIVACY_MAP = {
  public: 'is-green',
  link: 'is-orange',
  private: 'is-red'
};

module.exports = CoreView.extend({

  className: 'Editor-HeaderInfoEditor',

  initialize: function (opts) {
    if (!opts.router) throw new Error('router is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.visModel) throw new Error('visModel is required');
    if (!opts.syncModel) throw new Error('syncModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._tableModel = opts.tableModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._syncModel = opts.syncModel;
    this._visModel = opts.visModel;
    this._router = opts.router;

    this._setDocumentTitle();
    this._initBinds();
  },

  render: function () {
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
