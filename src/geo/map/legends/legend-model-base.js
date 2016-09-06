var Backbone = require('backbone');

var LegendModelBase = Backbone.Model.extend({
  defaults: {
    visible: false
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return this.get('visible');
  },

  isAvailable: function () {
    throw new Error('subclasses of LegendModelBase must implement isAvailable');
  }
});

module.exports = LegendModelBase;
