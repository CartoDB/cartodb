var cdb = require('cartodb.js');

/**
 *  Label component
 */

module.exports = cdb.core.View.extend({
  className: 'Label',

  initialize: function () {
    if (!this.model) {
      throw new Error('A model should be provided');
    }
  },

  render: function () {
    this.$el.html(this.model.get('label'));
    return this;
  }
});
