var CoreView = require('backbone/core-view');
var Template = require('./notifier-item.tpl');
var ActionView = require('./notifier-action-view');
var closeTemplate = require('./notifier-close.tpl');
var actionTemplate = require('./notifier-action.tpl');

module.exports = CoreView.extend({
  className: 'Notifier-inner',
  tagName: 'li',
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

    this._delay = this._notifierModel.get('delay') || this._notifierModel.get('defaultDelay');

    if (this._notifierModel.get('delay') && this._notifierModel.get('closable') !== false) {
      this._timeout = setTimeout(this._autoClose.bind(this), this._delay);
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    this._changeStyle();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._notifierModel, 'change', this.render);
    this.listenTo(this._notifierModel, 'change:status', this._onChangeStatus);
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
      isActionable: actionable,
      isClosable: closable
    });

    this.$el.append(view);

    if (actionable) {
      this._createActionView(actionable);
    }

    if (closable) {
      this._createCloseView();
    }
  },

  _createActionView: function (action) {
    var actionView = new ActionView({
      template: actionTemplate,
      className: 'js-action',
      model: this._notifierModel,
      editorModel: this._editorModel
    });

    this.$('.js-actionButton').append(actionView.render().el);
    this.addView(actionView);
  },

  _createCloseView: function () {
    var actionView = new ActionView({
      template: closeTemplate,
      className: 'CDB-Shape js-close',
      editorModel: this._editorModel
    });

    this.$('.js-closeButton').append(actionView.render().el);
    this.addView(actionView);
  },

  _closeHandler: function () {
    var status = this._notifierModel.getStatus();
    var action = this._notifierModel.getAction();
    this._notifierModel.trigger('notification:close', action || status);
    clearTimeout(this._timeout);
    if (this._notifierModel && this._notifierModel.collection) {
      this._notifierModel.collection.remove(this._notifierModel);
    }
  },

  _actionHandler: function () {
    var status = this._notifierModel.getStatus();
    var action = this._notifierModel.getAction();
    this._notifierModel.trigger('notification:action', action || status);
  },

  _changeStyle: function () {
    this.$('.Notifier-info').toggleClass('u-whiteTextColor', this._editorModel.isEditing());
    this.$('.Notifier-actions .CDB-Shape-close').toggleClass('is-blue', !this._editorModel.isEditing());
    this.$('.Notifier-actions .CDB-Shape-close').toggleClass('is-white', this._editorModel.isEditing());
  },

  _autoClose: function () {
    this._notifierModel.set({action: 'autoclose'}, {silent: true});
    this._closeHandler();
  },

  _onChangeStatus: function (model, status) {
    if ((status === 'success' || status === 'error') && this._notifierModel.get('closable') !== false && this._notifierModel.get('autoclosable') !== false) {
      this._timeout = setTimeout(this._autoClose.bind(this), this._delay);
    }
  }
});
