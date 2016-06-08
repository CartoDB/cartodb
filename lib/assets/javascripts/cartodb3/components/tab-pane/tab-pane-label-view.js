var CoreView = require('backbone/core-view');

/**
 *  Label component
 */

module.exports = CoreView.extend({
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
