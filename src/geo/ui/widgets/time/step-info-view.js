var View = require('cdb/core/view');
var template = require('./step-info.tpl');

/**
 * View for displaying info of the current step in the time-series
 */
module.exports = View.extend({

  initialize: function() {
    this.model.bind('change:stepDate', this.render, this);
  },

  render: function() {
    var step = this.model.get('stepDate') || '…';
    this.$el.html(
      template({
        step: step.toString()
      })
    );
    return this;
  }
});
