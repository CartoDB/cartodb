var _ = cdb._;
var View = cdb.core.View;
var TorqueControlsView = require('./torque-controls-view');
var TorqueTimeInfoView = require('./torque-time-info-view');
var TorqueCumulativeRenderInfoView = require('./torque-cumulative-render-info-view');
var TorqueResetCumulativeRenderView = require('./torque-reset-cumulative-render-view');

/**
 * View for the header in the torque time-series view
 */
module.exports = View.extend({

  initialize: function() {
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._torqueLayerModel.bind('change:cumulativeRender', this.render, this);
    this.add_related_model(this._torqueLayerModel);
  },

  render: function() {
    this.clearSubViews();

    if (this._torqueLayerModel.get('cumulativeRender')) {
      this.el.classList.add('CDB-Widget-contentSpaced');
      // TODO implement view for selected range of cumulativeRender + clear-button
      this._appendView(
        new TorqueCumulativeRenderInfoView({
          model: this.model,
          torqueLayerModel: this._torqueLayerModel
        })
      );
      this._appendView(
        new TorqueResetCumulativeRenderView({
          model: this._torqueLayerModel
        })
      );
    } else {
      this.el.classList.remove('CDB-Widget-contentSpaced');
      this._appendView(
        new TorqueControlsView({
          model: this._torqueLayerModel
        })
      );
      this._appendView(
        new TorqueTimeInfoView({
          model: this._torqueLayerModel
        })
      );
    }

    return this;
  },

  _appendView: function(view) {
    this.addView(view);
    this.$el.append(view.el);
    view.render();
  }
});
