var cdb = require('cartodb.js');
var template = require('./torque-controls.tpl');

/**
 * Torque animation controls, to manage run state
 */
module.exports = cdb.core.View.extend({
  tagName: 'button',
  className: 'CDB-Widget-controlButton',

  events: {
    'click': '_onClick'
  },

  initialize: function () {
    this.model.bind('change:isRunning', this.render, this);
  },

  render: function () {
    this.$el.html(
      template({
        iconClass: 'CDB-Widget-controlButtonIcon CDB-Widget-controlButtonIcon--' + (
          this.model.get('isRunning')
            ? 'pause'
            : 'play')
      })
    );

    return this;
  },

  _onClick: function () {
    if (this.model.get('isRunning')) {
      this.model.pause();
    } else {
      this.model.play();
    }
  }
});
