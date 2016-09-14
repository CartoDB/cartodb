var Backbone = require('backbone');

var LegendModelBase = Backbone.Model.extend({

  defaults: function () {
    var type = this.constructor.prototype.TYPE;
    if (!type) throw new Error('Subclasses of LegendModelBase must have a TYPE');
    return {
      visible: false,
      type: type
    };
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

module.exports = LegendModelBase;
