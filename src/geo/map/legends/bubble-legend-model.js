var Backbone = require('backbone');

var BubbleLegendModel = Backbone.Model.extend({
  defaults: {
    visible: false,
    type: 'bubble'
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return this.get('visible');
  }
});

module.exports = BubbleLegendModel;
