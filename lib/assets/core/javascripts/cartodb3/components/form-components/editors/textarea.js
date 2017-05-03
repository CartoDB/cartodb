var Backbone = require('backbone');

Backbone.Form.editors.TextArea = Backbone.Form.editors.Text.extend({
  tagName: 'textarea',
  className: 'CDB-Textarea',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts);
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
  },

  render: function () {
    this.setValue(this.value);
    this._toggleDisableState();

    return this;
  },

  getValue: function () {
    var val = this.$el.val();

    return (val === '') ? null : val;
  },

  _toggleDisableState: function () {
    if (this.options.disabled) {
      this.$el.attr('readonly', '');
      this.$el.attr('placeholder', '');
    } else {
      this.$el.removeAttr('readonly');
      this._togglePlaceholder();
    }

    this.$el.toggleClass('is-disabled', !!this.options.disabled);
  }
});
