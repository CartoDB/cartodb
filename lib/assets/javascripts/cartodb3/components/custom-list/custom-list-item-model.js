var _ = require('underscore');
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
    return _.isUndefined(this.get('label')) ? this.getValue() : this.get('label');
  },

  getValue: function () {
    return this.get('val');
  }

});
