var CoreView = require('backbone/core-view');
var TorqueTimeInfoView = require('./torque-time-info-view');
var TimeSeriesHeaderView = require('./time-series-header-view');
var template = require('./torque-header-view.tpl');

/**
 * View for the header in the torque time-series view
 */
module.exports = CoreView.extend({
  className: 'CDB-Widget-contentSpaced',

  initialize: function () {
    this._dataviewModel = this.options.dataviewModel;
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._rangeFilter = this._dataviewModel.filter;
    this._selectedAmount = this.options.selectedAmount;
    this._timeSeriesModel = this.options.timeSeriesModel;

    this.listenTo(this._rangeFilter, 'change', this.render);
  },

  render: function () {
    var showClearButton = true;
    this.clearSubViews();
    this.$el.addClass(this.className);
    this.$el.html(template());

    if (this._rangeFilter.isEmpty()) {
      this._appendView('.js-torque-controls',
        new TorqueTimeInfoView({
          dataviewModel: this._dataviewModel,
          torqueLayerModel: this._torqueLayerModel,
          timeSeriesModel: this._timeSeriesModel
        })
      );
      showClearButton = false;
    }
    this._createTimeSeriesHeaderView(showClearButton);

    return this;
  },

  _createTimeSeriesHeaderView: function (showClearButton) {
    var headerView = new TimeSeriesHeaderView({
      dataviewModel: this._dataviewModel,
      layerModel: this._torqueLayerModel,
      rangeFilter: this._dataviewModel.filter,
      showClearButton: showClearButton,
      timeSeriesModel: this._timeSeriesModel,
      selectedAmount: this._selectedAmount
    });
    this._appendView('.js-time-series-header', headerView);
    headerView.on('resetFilter', this._resetFilter, this);
  },

  _resetFilter: function () {
    // Move it to 0 so it doesn't stutter as much
    this._torqueLayerModel.set({ step: 0 });
    this._torqueLayerModel.resetRenderRange();
  },

  _appendView: function (selector, view) {
    this.addView(view);
    this.$(selector).append(view.render().el);
  }
});
