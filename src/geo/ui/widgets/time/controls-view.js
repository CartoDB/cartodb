var View = require('cdb/core/view');
var template = require('./controls.tpl');

/**
 * View for controlling play state of a time-series
 */
module.exports = View.extend({

  tagName: 'button',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.model.bind('change:play', this.render, this);
  },

  render: function() {
    this.$el.html(
      template({
        label: this.model.get('play')
          ? '▶'
          : '❚❚'
      })
    );
    return this;
  },

  _onClick: function() {
    this.model.set('play', !this.model.get('play'));
  }
});
