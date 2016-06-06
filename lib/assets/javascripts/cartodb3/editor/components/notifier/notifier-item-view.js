var cdb = require('cartodb.js');
var Notifier = require('./notifier');
var Template = require('./notifier-item.tpl');

module.exports = cdb.core.View.extend({
  className: 'Notifier-inner',
  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.notifierCollection) throw new Error('notifierCollection is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._editorModel = opts.editorModel;

    this.template = this.options.template || Template;
    this._notifierCollection = opts.notifierCollection;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._notifierCollection, 'change', this.render);
    this.add_related_model(this._notifierCollection);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _initViews: function () {
    var self = this;
    this._notifierCollection.forEach(function (model) {
      var action = model.createActionView();
      var actionView;
      var view = self.template({
        state: model.getState(),
        info: model.getInfo(),
        hasAction: action
      });

      self.$el.append(view);

      if (action) {
        actionView = action();
        actionView.on('notifier:action', self._actionHandler, self);
        self.$('.js-actions').append(actionView.render().el);
        self.addView(actionView);
      }
    });
  },

  _actionHandler: function (action) {
    if (action === 'close') {
      Notifier.removeNotification(this);
    }

    console.log(action);
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-dark', this._editorModel.isEditing());
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  }
});
