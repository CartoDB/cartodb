var cdb = require('cartodb.js');
var KeyChain = require('../../../components/keychain/keychain');

module.exports = cdb.core.View.extend({
  tagName: 'button',

  initialize: function (opts) {
    if (!opts.template) throw new Error('template is required');
    this.template = opts.template;
    this._editorModel = KeyChain.get('editorModel');
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
