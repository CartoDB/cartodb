var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');

/**
 *  Label component
 */

module.exports = cdb.core.View.extend({

  className: 'Label',

  initialize: function() {

    if (!this.model) {
      throw new Error('A model should be provided');
    }
  },

  render: function() {
    this.$el.append(this.model.get('label'));
    return this;
  }
});
