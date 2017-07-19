var cdb = require('cartodb.js');
var template = require('./torque-controls.tpl');

/**
 * Torque animation controls, to manage run state
 */
module.exports = cdb.core.View.extend({
  events: {
    'click .CDB-Widget-controlButton': '_onClick'
  },

  initialize: function () {
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._rangeFilter = this.options.rangeFilter;
    this.listenTo(this._torqueLayerModel, 'change:isRunning', this.render);
    this.listenTo(this._torqueLayerModel, 'change:start change.end', this.render);
  },

  render: function () {
    this.$el.html(
      template({
        running: this._torqueLayerModel.get('isRunning'),
        disabled: !this._rangeFilter.isEmpty()
      })
    );

    return this;
  },

  _onClick: function () {
    if (this._torqueLayerModel.get('isRunning')) {
      this._torqueLayerModel.pause();
    } else {
      this._torqueLayerModel.play();
    }
  }
});
