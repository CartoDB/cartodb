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
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._torqueLayerModel.bind('change:renderRange', this._onRenderRangeChange, this);
    this.add_related_model(this._torqueLayerModel);

    this._setHasSelectedRange();
  },

  render: function () {
    this.clearSubViews();

    if (this._hasRenderRange) {
      this.el.classList.add('CDB-Widget-contentSpaced');
      this._appendView(
        new TorqueRenderRangeInfoView({
          model: this.model,
          torqueLayerModel: this._torqueLayerModel
        })
      );
      this._appendView(
        new TorqueResetRenderRangeView({
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

  _onRenderRangeChange: function () {
    var prev = this._hasRenderRange;
    this._setHasSelectedRange();
    if (prev !== this._hasRenderRange) {
      this.render();
    }
  },

  _setHasSelectedRange: function () {
    var r = this._torqueLayerModel.get('renderRange');
    this._hasRenderRange = r && r.start !== r.end;
  },

  _appendView: function (view) {
    this.addView(view);
    this.$el.append(view.el);
    view.render();
  }
});
