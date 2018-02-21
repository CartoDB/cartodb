var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('./editor-helpers-extend');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

Backbone.Form.editors.Text = Backbone.Form.editors.Text.extend({
  className: 'CDB-InputText CDB-Text',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    var schema = this.schema;

    // Allow customising text type (email, phone etc.) for HTML5 browsers
    var type = 'text';

    if (schema && schema.editorAttrs && schema.editorAttrs.type) type = schema.editorAttrs.type;
    if (schema && schema.dataType) type = schema.dataType;

    if (this.options.editorAttrs && this.options.editorAttrs.help) {
      this._help = this.options.editorAttrs.help;
    }

    this.$el.attr('type', type);

    this.determineChange = _.debounce(this.determineChange, 200);
  },

  render: function () {
    this.setValue(this.value);
    this._toggleDisableState();

    if (this._isCopyButtonEnabled()) {
      this._toggleClipboardState();
    }

    if (this._help) {
      this._removeTooltip();

      if (!this.options.disabled) {
        this._helpTooltip = new TipsyTooltipView({
          el: this.$el,
          gravity: 'w',
          title: function () {
            return this._help;
          }.bind(this)
        });
      }
    }

    return this;
  },

  getValue: function () {
    var val = this.$el.val();

    return (val === '') ? null : val;
  },

  _toggleClipboardState: function () {
    this.$el.toggleClass('Share-input-field u-ellipsis', this._isCopyButtonEnabled());
  },

  _togglePlaceholder: function () {
    if (this.options.placeholder) {
      this.$el.attr('placeholder', this.options.placeholder);
    } else {
      var placeholder = (this.value === null) ? 'null' : '';
      this.$el.attr('placeholder', placeholder);
    }
  },

  _toggleDisableState: function () {
    if (this.options.disabled) {
      this.$el.attr('readonly', '');
      this.$el.attr('placeholder', '');

      // if it's disabled AND has copy, leave just readonly
      if (this._isCopyButtonEnabled()) {
        this.$el.removeAttr('disabled');
      }
    } else {
      this.$el.removeAttr('readonly');
      this._togglePlaceholder();
    }

    this.$el.toggleClass('is-disabled', !!this.options.disabled);
  },

  _isCopyButtonEnabled: function () {
    return !!this.options.hasCopyButton;
  },

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  remove: function () {
    this._removeTooltip();

    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
