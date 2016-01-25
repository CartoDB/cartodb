var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  Label component
 */

module.exports = cdb.core.View.extend({

  className: 'Label',

  initialize: function() {

    if (!this.options.title) {
      throw new Error('A title should be provided');
    }
  },

  render: function() {
    this.$el.append(this.options.title);
    return this;
  }
});
