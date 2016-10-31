var Backbone = require('backbone');

Backbone.Form.editors.Text = Backbone.Form.editors.Text.extend({
  className: 'CDB-InputText CDB-Text',

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype._setOptions.call(this, opts); // Options
    this.constructor.__super__.initialize.apply(this, arguments);
  },

  render: function () {
    var value = this._isNull(this.value) ? 'null' : this.value;

    this.setValue(value);
    this.$el.val(value);

    if (this._isNull(this.value)) {
      this.$el.addClass('is-null');
    }

    return this;
  },

  _isNull: function (value) {
    return value === null;
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
