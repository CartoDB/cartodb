var CoreView = require('backbone/core-view');
var template = require('./tab-pane-label.tpl');

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
    this.$el.html(template({
      label: this.model.get('label'),
      selectedChild: this.model.get('selectedChild') || ''
    }));
    return this;
  }
});
