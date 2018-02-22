var CoreView = require('backbone/core-view');
var template = require('./undo-redo.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

module.exports = CoreView.extend({
  events: {
    'click .js-redo': '_onRedoClick',
    'click .js-undo': '_onUndoClick',
    'click .js-apply': '_onApplyClick',
    'click .js-clear': '_onClearClick'
  },

  options: {
    applyButton: false,
    cancelButton: false
  },

  initialize: function (opts) {
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.trackModel) throw new Error('trackModel is required');

    this._trackModel = opts.trackModel;
    this._editorModel = opts.editorModel;
    this._clearModel = opts.clearModel;
    this._applyStatusModel = opts.applyStatusModel;
    this._overlayModel = opts.overlayModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var canClear = false;
    if (this._clearModel) {
      canClear = this._clearModel.get('visible') === true;
    }

    this.$el.html(
      template({
        canUndo: this._canUndo(),
        canRedo: this._canRedo(),
        canApply: this.options.applyButton && this._editorModel.isEditing(),
        canClear: canClear,
        isDisabled: this._isDisabled(),
        isLoading: this._applyStatusModel && this._applyStatusModel.get('loading')
      })
    );

    this._initViews();
    this._checkButtonsStyle();

    return this;
  },

  _initViews: function () {
    if (this._canUndo()) {
      var undoTooltip = new TipsyTooltipView({
        el: this.$('.js-undo'),
        gravity: 's',
        title: function () {
          return _t('components.undo-redo.undo');
        }
      });
      this.addView(undoTooltip);
    }

    if (this._canRedo()) {
      var redoTooltip = new TipsyTooltipView({
        el: this.$('.js-redo'),
        gravity: 's',
        title: function () {
          return _t('components.undo-redo.redo');
        }
      });
      this.addView(redoTooltip);
    }
  },

  _initBinds: function () {
    this.listenTo(this._trackModel, 'undo redo', this.render);
    this.listenTo(this._trackModel, 'unredoChanged', this.render);

    this.listenTo(this._editorModel, 'change:edition', this._checkButtonsStyle);

    if (this._overlayModel) {
      this.listenTo(this._overlayModel, 'change:visible', this.render);
    }

    if (this._clearModel) {
      this.listenTo(this._clearModel, 'change', this.render);
    }

    if (this._applyStatusModel) {
      this.listenTo(this._applyStatusModel, 'change:loading', this._applyStatusChanged);
    }
  },

  _isDisabled: function () {
    return this._overlayModel && this._overlayModel.get('visible');
  },

  _canRedo: function () {
    return this._trackModel.canRedo() && !this._isDisabled();
  },

  _canUndo: function () {
    return this._trackModel.canUndo() && !this._isDisabled();
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
    if (this.options.applyButton && this.options.onApplyClick && !this._isDisabled()) {
      this.options.onApplyClick();
    }
  },

  _onClearClick: function () {
    if (this.options.clearButton && this.options.onClearClick) {
      this.options.onClearClick();
    }
  },

  _checkButtonsStyle: function (m) {
    var editing = this._editorModel.isEditing();
    this._getIcons().toggleClass('u-actionTextColor', !editing);
    this._getIcons().toggleClass('u-whiteTextColor', editing);
  },

  _getIcons: function () {
    return this.$('.js-theme');
  },

  _applyStatusChanged: function () {
    this.render();
  }
});
