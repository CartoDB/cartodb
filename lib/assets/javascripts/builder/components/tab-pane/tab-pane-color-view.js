var CoreView = require('backbone/core-view');
var template = require('./tab-pane-color.tpl');

/**
 *  Label component
 */

module.exports = CoreView.extend({
  className: 'Label',

  initialize: function () {
    if (!this.model) {
      throw new Error('A model should be provided');
    }
    this.model.bind('change:label', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      color: this.model.get('label'),
      selectedChild: this.model.get('selectedChild') || ''
    }));
    return this;
  }
});
