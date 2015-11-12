var View = require('cdb/core/view');
var template = require('./controls.tpl');

/**
 * View for controlling play state of a time-series
 * Is only displayed if there is a step
 */
module.exports = View.extend({

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.model.bind('change:isRunning', this.render, this);
  },

  render: function() {
    if (this.model.get('step')) {
      this.hide();
    } else {
      this.$el.html(
        template({
          label: this.model.get('isRunning')
            ? '❚❚'
            : '▶'
        })
      );
      this.show();
    }
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
