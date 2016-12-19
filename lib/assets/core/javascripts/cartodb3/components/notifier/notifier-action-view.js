var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  tagName: 'button',

  initialize: function (opts) {
    if (!opts.template) throw new Error('template is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this.template = opts.template;
    this._editorModel = opts.editorModel;
    this._data = {};
    if (opts.model) {
      this._data = opts.model.toJSON();
    }
    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(this.template(this._data));
    return this;
  },

  _changeStyle: function () {
    this.$('.js-theme').toggleClass('is-white', this._editorModel.isEditing());
  }
});
