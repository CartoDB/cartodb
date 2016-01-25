var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  Icon component
 */

module.exports = cdb.core.View.extend({

  className: 'CDB-IconFont',

  initialize: function(options) {

    if (!this.options.name) {
      throw new Error('A name should be provided');
    }
  },

  render: function() {
    this.$el.addClass('CDB-IconFont-' + this.options.name);
    return this;
  }
});
