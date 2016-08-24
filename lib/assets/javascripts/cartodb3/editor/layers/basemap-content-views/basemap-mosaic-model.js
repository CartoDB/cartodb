var Backbone = require('backbone');

/*
 *  List item model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    highlightedAdd: false
  },

  getHighlighted: function () {
    return this.get('highlightedAdd') && this;
  },

  getName: function () {
    return 'Add';
  }

});
