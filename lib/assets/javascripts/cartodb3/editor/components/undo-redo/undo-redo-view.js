var cdb = require('cartodb.js');
var template = require('./undo-redo.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-redo': '_onRedoClick',
    'click .js-undo': '_onUndoClick',
    'click .js-apply': '_onApplyClick'
  },

  options: {
    applyButton: false
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.trackModel) throw new Error('trackModel is required');

    this._trackModel = opts.trackModel;
    this._editorModel = opts.editorModel;

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        canUndo: this._trackModel.canUndo(),
        canRedo: this._trackModel.canRedo(),
        canApply: this.options.applyButton && this._editorModel.isEditing()
      })
    );
    this._checkButtonsStyle();
    return this;
  },

  _initBinds: function () {
    this._trackModel.bind('undo redo', this.render, this);
    this._trackModel.bind('unredoChanged', this.render, this);
    this._editorModel.bind('change:edition', this._checkButtonsStyle, this);
    this.add_related_model(this._trackModel);
    this.add_related_model(this._editorModel);
  },

  _onUndoClick: function () {
    if (this._trackModel.canUndo()) {
      this._trackModel.undo();
    }
  },

  _onRedoClick: function () {
    if (this._trackModel.canRedo()) {
      this._trackModel.redo();
    }
  },

  _onApplyClick: function () {
    if (this.options.applyButton && this.options.onApplyClick) {
      this.options.onApplyClick();
    }
  },

  _checkButtonsStyle: function (m) {
    var editing = this._editorModel.isEditing();
    this._getIcons().toggleClass('u-whiteTextColor', editing);
  },

  _getIcons: function () {
    return this.$('.js-theme');
  }
});
