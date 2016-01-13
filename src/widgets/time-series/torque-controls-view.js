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
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._torqueLayerModel.bind('change:isRunning', this.render, this);
    this.add_related_model(this._torqueLayerModel);
  },

  render: function () {
    this.$el.html(
      template({
        iconClass: 'CDB-Widget-controlButtonIcon CDB-Widget-controlButtonIcon--' + (
          this._torqueLayerModel.get('isRunning')
            ? 'pause'
            : 'play')
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
