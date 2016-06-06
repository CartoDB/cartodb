var cdb = require('cartodb.js');
var Notifier = require('./notifier');
var Template = require('./notifier-item.tpl');

module.exports = cdb.core.View.extend({
  className: 'Notifier-inner',
  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.notifierCollection) throw new Error('notifierCollection is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this.template = this.options.template || Template;

    this._notifierCollection = opts.notifierCollection;
    this._editorModel = opts.editorModel;

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
  },

  _initViews: function () {
    var self = this;
    this._notifierCollection.forEach(function (model) {
      var action = model.get('createActionView');
      var actionView;
      var view = self.template({
        state: model.getState(),
        info: model.getInfo(),
        hasAction: action
      });
      self.$el.append(view);

      if (action) {
        actionView = action({
          triggerId: self.cid,
          menuItems: model.getMenu(),
          editorModel: self._editorModel
        });

        actionView.on('notifier:close', self._closeHandler, self);
        self.$('.js-actions').append(actionView);
        self.addView(actionView);
      }
    });
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-white', this._editorModel.isEditing());
  },

  _closeHandler: function () {
    Notifier.removeNotice(this);
  }
});
