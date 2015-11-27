var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var HistogramChartView = require('../histogram/chart');
var TorqueTimeMarkerview = require('./torque-time-marker-view');

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 * this.model is a histogram model
 */
module.exports = View.extend({

  className: 'Widget-content Widget-content--timeSeries',

  // TODO could be calculated from element styles instead of duplicated numbers here?
  defaults: {
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 24
    }
  },

  initialize: function() {
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');
    if (!this.options.rangeFilter) throw new Error('rangeFilter is required');

    this._rangeFilter = this.options.rangeFilter;
    this._torqueLayerModel = this.options.torqueLayerModel;

    this._viewModel = new Model({
      margins: this.defaults.margins,
      histogramChartMargins: {
        top: 4,
        right: 4,
        bottom: 20,
        left: 4
      },
      histogramChartHeight:
        48 + // inline bars height
        20 + // bottom labels
        4 // margins
    });

    this.model.bind('change:data', this._onChangeData, this);
  },

  _onChangeData: function() {
    if (this._chartView) {
      this._chartView.replaceData(this.model.getData());
    }
  },

  render: function() {
    this.clearSubViews();
    this._createHistogramView();
    return this;
  },

  _createHistogramView: function() {
    this._chartView = new HistogramChartView({
      type: 'time',
      animationSpeed: 100,
      margin: this._viewModel.get('histogramChartMargins'),
      handles: true,
      height: this._viewModel.get('histogramChartHeight'),
      data: this.model.getData()
    });
    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.bind('on_brush_end', this._onBrushEnd, this);
    this._chartView.show();

    var timeMarkerView = new TorqueTimeMarkerview({
      model: this.model, // a histogram model
      chartView: this._chartView,
      viewModel: this._viewModel,
      torqueLayerModel: this._torqueLayerModel
    });
    this.addView(timeMarkerView);
    timeMarkerView.render();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this._rangeFilter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
    this._torqueLayerModel.setStepsRange(loBarIndex, hiBarIndex);
  }

});
