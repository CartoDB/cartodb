var Backbone = require('backbone');

Backbone.Form.editors.TextArea = Backbone.Form.editors.TextArea.extend({
  className: 'CDB-Textarea',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts); // Options
    this.constructor.__super__.initialize.apply(this, arguments);
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
    } else {
      this.$el.removeAttr('readonly');
    }

    this.$el.toggleClass('is-disabled', !!this.options.disabled);
  }
});
