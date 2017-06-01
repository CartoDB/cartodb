var cdb = require('cartodb.js');
var TorqueControlsView = require('./torque-controls-view');
var TorqueTimeInfoView = require('./torque-time-info-view');
var TimeSeriesHeaderView = require('./time-series-header-view');
var template = require('./torque-header-view.tpl');

/**
 * View for the header in the torque time-series view
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget-header CDB-Widget-header--timeSeries CDB-Widget-contentSpaced',

  initialize: function () {
    this._dataviewModel = this.options.dataviewModel;
    this._torqueLayerModel = this.options.torqueLayerModel;
    this._rangeFilter = this._dataviewModel.filter;

    this._rangeFilter.bind('change', this.render, this);
    this.add_related_model(this._rangeFilter);
  },

  render: function () {
    var showClearButton = true;
    this.clearSubViews();
    this.$el.empty();
    this.$el.addClass(this.className);
    this.$el.html(template());

    if (this._rangeFilter.isEmpty()) {
      this._appendView('.js-torque-controls',
        new TorqueControlsView({
          torqueLayerModel: this._torqueLayerModel
        })
      );
      this._appendView('.js-torque-controls',
        new TorqueTimeInfoView({
          dataviewModel: this._dataviewModel,
          torqueLayerModel: this._torqueLayerModel
        })
      );
      showClearButton = false;
    }
    this._createTimeSeriesHeaderView(showClearButton);

    this.$el.attr('data-component', 'torque-header-view');

    return this;
  },

  _createTimeSeriesHeaderView: function (showClearButton) {
    var headerView = new TimeSeriesHeaderView({
      dataviewModel: this._dataviewModel,
      rangeFilter: this._dataviewModel.filter,
      showClearButton: showClearButton
    });
    this._appendView('.js-time-series-header', headerView);
    this.listenTo(headerView, 'resetFilter', this._resetFilter);
  },

  _resetFilter: function () {
    this._torqueLayerModel.resetRenderRange();
  },

  _appendView: function (selector, view) {
    this.addView(view);
    this.$(selector).append(view.render().el);
  }
});
