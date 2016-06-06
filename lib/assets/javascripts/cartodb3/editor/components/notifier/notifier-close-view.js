var cdb = require('cartodb.js');
var Template = require('./notifier-close.tpl');

module.exports = cdb.core.View.extend({
  tagName: 'button',
  className: 'CDB-Shape',
  events: {
    'click': '_clickHandler'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._editorModel = opts.editorModel;
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(Template());
    return this;
  },

  _clickHandler: function () {
    this.trigger('notifier:close');
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-white', this._editorModel.isEditing());
  }
});
