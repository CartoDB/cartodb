var Backbone = require('backbone');

/*
 *  List item model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    disabled: false,
    selected: false,
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
