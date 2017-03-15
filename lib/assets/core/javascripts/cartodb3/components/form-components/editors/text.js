var _ = require('underscore');
var Backbone = require('backbone');
var UP_ARROW_KEY_CODE = 38;
var BOTTOM_ARROW_KEY_CODE = 40;
var SMALL_INCREMENT = 1;
var BIG_INCREMENT = 10;

Backbone.Form.editors.Text = Backbone.Form.editors.Text.extend({
  className: 'CDB-InputText CDB-Text',

  events: {
    'keydown': '_onInputKeyDown',
    'keyup': '_onInputKeyUp'
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts); // Options
    this.constructor.__super__.initialize.apply(this, arguments);
  },

  render: function () {
    this.setValue(this.value);
    this._toggleDisableState();

    if (this._isCopyButtonEnabled()) {
      this._toggleClipboardState();
    }

    return this;
  },

  _onInputKeyUp: function () {
    this.value = this.$el.val();
    this.trigger('change', this);
  },

  _onInputKeyDown: function (e) {
    var value = +this.getValue();
    var inc = SMALL_INCREMENT;

    if (!_.isNumber(value) || _.isNaN(value)) {
      return;
    }

    if (e.shiftKey === true) {
      inc = BIG_INCREMENT;
    }

    if (e.which === UP_ARROW_KEY_CODE) {
      value += inc;
      this.$el.val(value);
    } else if (e.which === BOTTOM_ARROW_KEY_CODE) {
      value -= inc;
      this.$el.val(value);
    }

    this.value = value;
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
  }
});
