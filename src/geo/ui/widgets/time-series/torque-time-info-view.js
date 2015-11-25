var d3 = require('d3');
var View = require('cdb/core/view');

/**
 * View rendering the current step time
 *
 * Model is expected to be a torque layer model
 */
module.exports = View.extend({

  initialize: function() {
    this.model.bind('change:step', this.render, this);

    // for format rules see https://github.com/mbostock/d3/wiki/Time-Formatting
    this._formatter = d3.time.format('%H:%M %x');
  },

  render: function() {
    this.$el.html(
      this._formatter(
        new Date(this.model.get('time'))
      )
    );

    return this;
  }
});
