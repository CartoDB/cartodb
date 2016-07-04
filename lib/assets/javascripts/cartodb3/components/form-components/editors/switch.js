var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./switch.tpl');

Backbone.Form.editors.Switch = Backbone.Form.editors.Base.extend({
  events: {
    'change .js-input': function () {
      this.trigger('change', this);
    },
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    this.options = _.extend(
      {},
      this.options,
      opts.schema.options
    );

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
  },

  render: function () {
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.$el.html(template({
      checked: this.value
    }));
  },

  getValue: function () {
    return this.$('.js-input').is(':checked');
  },

  setValue: function (value) {
    this.$('.js-input').prop('checked', value);
    this.value = value;
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$el.focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$el.blur();
  }
});
