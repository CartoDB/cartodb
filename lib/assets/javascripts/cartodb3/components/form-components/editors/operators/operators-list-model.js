var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    visible: false,
    operator: 'count',
    attribute: ''
  },

  isValid: function () {
    if (this.get('operator') !== 'count' && !this.get('attribute')) {
      return false;
    }
    return true;
  }

});
