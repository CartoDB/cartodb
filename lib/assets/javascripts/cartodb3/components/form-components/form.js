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
  },

  commit: function (options) {
    if (!this.isEnabled()) {
      return false;
    } else {
      this.constructor.__super__.commit.apply(this, arguments);
    }
  },

  validate: function (options) {
    if (!this.isEnabled()) {
      return null;
    } else {
      return this.constructor.__super__.validate.apply(this, arguments);
    }
  }
});
