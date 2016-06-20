var CoreView = require('backbone/core-view');
var Template = require('./tab-pane-label.tpl');

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
    this.$el.html(Template(this.model.toJSON()));
    return this;
  }
});
