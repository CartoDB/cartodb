var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    visible: false,
    operator: 'avg',
    attribute: ''
  },

  isValidOperator: function () {
    if (this.get('operator') && this.get('attribute')) {
      return true;
    }
    return false;
  }

});
