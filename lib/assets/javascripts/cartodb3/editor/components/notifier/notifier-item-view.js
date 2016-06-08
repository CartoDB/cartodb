var CoreView = require('backbone/core-view');
var Template = require('./notifier-item.tpl');
var ActionView = require('./notifier-action-view');
var closeTemplate = require('./notifier-close.tpl');
var actionTemplate = require('./notifier-action.tpl');

module.exports = CoreView.extend({
  className: 'Notifier-inner',
  tagName: 'ul',
  events: {
    'click .js-close': '_closeHandler',
    'click .js-action': '_actionHandler'
  },

  initialize: function (opts) {
    if (!opts.notifierModel) throw new Error('notifierModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._editorModel = opts.editorModel;
    this.template = this.options.template || Template;
    this._notifierModel = opts.notifierModel;
    this.$el.attr('id', this._notifierModel.get('id'));
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._notifierModel, 'change', this.render);
    this.add_related_model(this._notifierModel);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _initViews: function () {
    var actionable = this._notifierModel.getButton();
    var closable = this._notifierModel.isClosable();
    var view = this.template({
      status: this._notifierModel.getStatus(),
      info: this._notifierModel.getInfo(),
      isActionable: actionable || closable
    });

    this.$el.append(view);

    if (actionable) {
      this._createActionView(actionable);
    } else if (closable) {
      this._createCloseView();
    }
  },

  _createActionView: function (action) {
    var actionView = new ActionView({
      template: actionTemplate,
      className: 'CDB-Button CDB-Button--primary CDB-Button--small js-action',
      model: this._notifierModel,
      editorModel: this._editorModel
    });

    this._addActionView(actionView);
  },

  _createCloseView: function () {
    var actionView = new ActionView({
      template: closeTemplate,
      className: 'CDB-Shape js-close',
      editorModel: this._editorModel
    });

    this._addActionView(actionView);
  },

  _addActionView: function (view) {
    this.$('.js-actions').append(view.render().el);
    this.addView(view);
  },

  _closeHandler: function (action) {
    this._notifierModel.trigger('notification:close');
  },

  _actionHandler: function (action) {
    this._notifierModel.trigger('notification:action');
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-dark', this._editorModel.isEditing());
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  }
});
