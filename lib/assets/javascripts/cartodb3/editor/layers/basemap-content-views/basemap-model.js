var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    id: null,
    default: false,
    urlTemplate: '',
    subdomains: '',
    minZoom: 0,
    maxZoom: 21,
    name: '',
    className: '',
    attribution: null,
    category: 'Custom',
    labels: null,
    type: 'Tiled',
    tms: false,
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
