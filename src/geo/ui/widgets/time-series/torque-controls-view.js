var View = require('cdb/core/view');
var template = require('./torque-controls.tpl');

/**
 * Torque animation controls, to manage run state
 */
module.exports = View.extend({

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.model.bind('change:isRunning', this.render, this);
  },

  render: function() {
    this.$el.html(
      template({
        label: this.model.get('isRunning')
          ? '❚❚'
          : '▶'
      })
    );

    return this;
  },

  _onClick: function() {
    if (this.model.get('isRunning')) {
      this.model.pause();
    } else {
      this.model.play();
    }
  }
});
