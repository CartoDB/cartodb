var Backbone = require('backbone');

Backbone.Form.editors.Text = Backbone.Form.editors.Text.extend({
  className: 'CDB-InputText CDB-Text',

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
