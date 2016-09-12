var Backbone = require('backbone');

var LegendViewBase = Backbone.View.extend({

  className: 'CDB-Legend-item',

  initialize: function (deps) {
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(this._getCompiledTemplate());

    if (this.model.isVisible() && this.model.isAvailable()) {
      this.$el.show();
    } else {
      this.$el.hide();
    }

    return this;
  },

  _getCompiledTemplate: function () {
    throw new Error('Subclasses of LegendViewBase must implement _getCompiledTemplate');
  },

  enable: function () {
    this.$el.removeClass('is-disabled');
  },

  disable: function () {
    this.$el.addClass('is-disabled');
  }
});

module.exports = LegendViewBase;
