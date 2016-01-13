var cdb = require('cartodb.js');
var template = require('./torque-reset-render-range.tpl');

/**
 * View to reset render range.
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-filterButtons',
  events: {
    'click .js-clear': '_onClick'
  },

  initialize: function () {
    this._torqueLayerModel = this.options.torqueLayerModel;
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onClick: function () {
    this._torqueLayerModel.resetRenderRange();
  }
});
