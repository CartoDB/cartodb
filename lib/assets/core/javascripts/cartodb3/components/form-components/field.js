var Backbone = require('backbone');
var $ = require('jquery');
var TipsyTooltipView = require('../tipsy-tooltip-view.js');
var Clipboard = require('clipboard');

Backbone.Form.Field = Backbone.Form.Field.extend({

  render: function () {
    this.constructor.__super__.render.apply(this, arguments);
    if (this.schema.help) {
      this._setHelp();
    }
    if (this._isCopyButtonEnabled()) {
      this._initClipboard();
    }
    return this;
  },

  _setHelp: function () {
    this._helpTooltip = this._createTooltip({
      $el: this.$('.js-help')
    });
  },

  // Changed original setError function in order to add
  // the error tooltip
  setError: function (msg) {
    if (this.editor.hasNestedForm) return;
    this.$el.addClass(this.errorClassName);
    this._destroyErrorTooltip();
    this._errorTooltip = this._createTooltip({
      gravity: 'w',
      className: 'is-error',
      msg: msg,
      offset: 5
    });
    this._errorTooltip.showTipsy();
  },

  // Changed original clearError function in order to remove
  // the error tooltip
  clearError: function () {
    this.$el.removeClass(this.errorClassName);
    this._destroyErrorTooltip();
  },

  _initClipboard: function () {
    if (this._clipboard) {
      this._clipboard.destroy();
    }

    var btn = this.$('.js-copy');
    this._clipboard = new Clipboard(btn.get(0));
  },

  _createTooltip: function (opts) {
    return new TipsyTooltipView({
      el: opts.$el || this.$el,
      gravity: opts.gravity || 's',
      className: opts.className || '',
      offset: opts.offset || 0,
      title: function () {
        return opts.msg || $(this).data('tooltip');
      }
    });
  },

  _destroyErrorTooltip: function () {
    if (this._errorTooltip) {
      this._errorTooltip.hideTipsy();
      this._errorTooltip.destroyTipsy();
    }
  },

  _destroyHelpTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.destroyTipsy();
    }
  },

  _destroyClipboard: function () {
    if (this._clipboard) {
      this._clipboard.destroy();
    }
  },

  // Changed original templateData function in order to add a
  // new template attribute (hasNestedForm)
  templateData: function () {
    var schema = this.schema;
    return {
      help: schema.help || '',
      isCopyButtonEnabled: this._isCopyButtonEnabled(),
      hasNestedForm: this.editor.hasNestedForm,
      title: schema.title,
      fieldAttrs: schema.fieldAttrs,
      editorAttrs: schema.editorAttrs,
      key: this.key,
      editorId: this.editor.id,
      editorType: this.editor.el.type
    };
  },

  _isCopyButtonEnabled: function () {
    return !!this.schema.hasCopyButton;
  },

  remove: function () {
    this._destroyErrorTooltip();
    this._destroyHelpTooltip();
    this._destroyClipboard();
    this.editor.remove();
    Backbone.View.prototype.remove.call(this);
  }

}, {
  template: require('./field.tpl'),
  errorClassName: 'CDB-FieldError'
});
