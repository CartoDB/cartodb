var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

  defaults: {
    visible: false,
    operator: 'count',
    attribute: ''
  },

  isValidOperator: function () {
    var operator = this.get('operator');
    var attribute = this.get('attribute');

    if (operator === 'count') {
      return true;
    } else {
      if (operator && attribute) {
        return true;
      }
      return false;
    }
  }

});
