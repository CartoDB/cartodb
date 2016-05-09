var Backbone = require('backbone');

/*
 *  List item model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    selected: false
  },

  getName: function () {
    return this.get('label') || this.getValue();
  },

  getValue: function () {
    return this.get('val');
  }

});
