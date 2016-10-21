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

    return this;
  },

  _toggleDisableState: function () {
    if (this.options.disabled) {
      this.$el.attr('readonly', '');
      this.$el.attr('placeholder', '');
    } else {
      this.$el.removeAttr('readonly');
      this.$el.attr('placeholder', this.options.placeholder || '');
    }

    this.$el.toggleClass('is-disabled', !!this.options.disabled);
  }

});
