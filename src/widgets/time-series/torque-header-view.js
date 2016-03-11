var cdb = require('cartodb.js');
var TorqueControlsView = require('./torque-controls-view');
var TorqueTimeInfoView = require('./torque-time-info-view');
var TorqueRenderRangeInfoView = require('./torque-render-range-info-view');
var TorqueResetRenderRangeView = require('./torque-reset-render-range-view');

/**
 * View for the header in the torque time-series view
 */
module.exports = cdb.core.View.extend({
  initialize: function () {
    this._dataviewModel = this.options.dataviewModel;
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._rangeFilter = this._dataviewModel.filter;

    this._rangeFilter.bind('change', this.render, this);
    this.add_related_model(this._rangeFilter);
  },

  render: function () {
    this.clearSubViews();

    if (!this._rangeFilter.isEmpty()) {
      this.el.classList.add('CDB-Widget-contentSpaced');
      this._appendView(
        new TorqueRenderRangeInfoView({
          dataviewModel: this._dataviewModel
        })
      );
      this._appendView(
        new TorqueResetRenderRangeView({
          torqueLayerModel: this._torqueLayerModel
        })
      );
    } else {
      this.el.classList.remove('CDB-Widget-contentSpaced');
      this._appendView(
        new TorqueControlsView({
          torqueLayerModel: this._torqueLayerModel
        })
      );
      this._appendView(
        new TorqueTimeInfoView({
          torqueLayerModel: this._torqueLayerModel
        })
      );
    }

    return this;
  },

  _appendView: function (view) {
    this.addView(view);
    this.$el.append(view.el);
    view.render();
  }
});
