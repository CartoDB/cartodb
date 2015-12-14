var View = cdb.core.View
var template = require('./torque-reset-cumulative-render.tpl')

/**
 * View to reset cumulative render.
 * this.model is expected to be a torqueLayer model
 */
module.exports = View.extend({
  className: 'CDB-Widget-filterButtons',
  events: {
    'click .js-clear': '_onClick'
  },

  render: function () {
    this.$el.html(template())
    return this
  },

  _onClick: function () {
    this.model.resetCumulativeRender()
  }
})
