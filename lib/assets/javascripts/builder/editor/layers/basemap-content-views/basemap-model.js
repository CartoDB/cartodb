var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    default: false,
    minZoom: 0,
    maxZoom: 21,
    name: '',
    category: 'Custom',
    type: 'Tiled',
    selected: false,
    val: '',
    label: '',
    template: function () {
      return '';
    }
  },

  getName: function () {
    return this.get('label') || this.getValue();
  },

  getValue: function () {
    return this.get('val');
  }

});
