var Backbone = require('backbone');
var _ = require('underscore');

Backbone.Form = Backbone.Form.extend({

  initialize: function (options) {
    this.options = options = options || {};
    this.viewModel = new Backbone.Model({ enabled: true });
    this.viewModel.bind('change:enabled', this._onChangeEnabled, this);
    this.constructor.__super__.initialize.apply(this, arguments);
  },

  _onChangeEnabled: function () {
    this.trigger('change:enabled', this.isEnabled(), this);

    if (this.isEnabled()) {
      // this.validate();
      this.$el.show();
    } else {
      this.$el.hide();
    }
  },

  enable: function () {
    this.viewModel.set('enabled', true);
  },

  disable: function () {
    this.viewModel.set('enabled', false);
  },

  isEnabled: function () {
    return this.viewModel.get('enabled');
  }
});
