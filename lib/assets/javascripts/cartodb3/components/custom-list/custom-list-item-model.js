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
    return (this.get('label') == null) ? this.getValue() : this.get('label'); // eslint-disable-line
  },

  getValue: function () {
    return this.get('val');
  }

});
