var cdb = require('cartodb.js');
var template = require('./undo-redo.tpl');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-redo': '_onRedoClick',
    'click .js-undo': '_onUndoClick',
    'click .js-apply': '_onApplyClick'
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    this._styleModel = opts.styleModel;
    this._editorModel = opts.editorModel;

    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        canUndo: this._styleModel.canUndo(),
        canRedo: this._styleModel.canRedo(),
        canApply: this._editorModel.isEditing()
      })
    );
    this._onStyleChange(this._editorModel);
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('undo redo', this.render, this);
    this._styleModel.bind('change', this._onStyleChange, this);
    this._editorModel.bind('change:edition', this._onStyleChange, this);
    this.add_related_model(this._styleModel);
    this.add_related_model(this._editorModel);
  },

  _onUndoClick: function () {
    if (this._styleModel.canUndo()) {
      this._styleModel.undo();
    }
  },

  _onRedoClick: function () {
    if (this._styleModel.canRedo()) {
      this._styleModel.redo();
    }
  },

  _onApplyClick: function () {
    console.log('applying');
  },

  _onStyleChange: function (m) {
    var editing = m.isEditing();
    this._getIcons().toggleClass('u-whiteTextColor', editing);
  },

  _getIcons: function () {
    return this.$('.js-theme');
  }
});
