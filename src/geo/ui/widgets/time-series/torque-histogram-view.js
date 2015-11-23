var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var HistogramChartView = require('../histogram/chart');
var TorqueTimeMarkerview = require('./torque-time-marker-view');

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 */
module.exports = View.extend({

  // TODO could be calculated from element styles instead of duplicated numbers here?
  defaults: {
    width: 400,
    margins: {
      top: 0,
      right: 24,
      bottom: 0,
      left: 24
    }
  },

  initialize: function() {
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');
    if (!this.options.filter) throw new Error('filter is required');

    this._filter = this.options._filter;

    _.bindAll(this, '_onWindowResize');
    $(window).bind('resize', this._onWindowResize);

    this._viewModel = new Model({
      width: this.defaults.width,
      histogramChartMargins: {
        top: 4,
        right: 4,
        bottom: 20,
        left: 4
      },
      margins: this.defaults.margins,
      histogramChartHeight:
        48 + // inline bars height
        20 + // bottom labels
        4 // margins
    });
    this._viewModel.bind('change:width', this._onChangeWidth, this);
    this.add_related_model(this._viewModel);

    // TODO w/o this the timemarker ends up behind the removed-and-added elements in the histogram chart,
    // can we avoid that?
    this.model.bind('change:data', this.render, this);
    this._viewModel.bind('change:width', this.render, this);

    this._onChangeWidth();
  },

  render: function() {
    this.clearSubViews();
    this._createHistogramView();
    this._onWindowResize();
    return this;
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    View.prototype.clean.call(this);
  },

  _createHistogramView: function() {
    this._chartView = new HistogramChartView({
      type: 'time',
      animationSpeed: 100,
      margin: this._viewModel.get('histogramChartMargins'),
      handles: true,
      width: this._viewModel.get('histogramChartWidth'),
      height: this._viewModel.get('histogramChartHeight'),
      data: this.model.getData()
    });
    this.addView(this._chartView);
    this.$el.append(this._chartView.render().el);
    this._chartView.bind('on_brush_end', this._onBrushEnd, this);
    this._chartView.show();

    var timeMarkerView = new TorqueTimeMarkerview({
      chartCanvas: this._chartView.chart,
      viewModel: this._viewModel,
      torqueLayerModel: this.options.torqueLayerModel
    });
    this.addView(timeMarkerView);
    timeMarkerView.render();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this._setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
  },

  _setRange: function(start, end) {
    this._filter.setRange({ min: start, max: end });
  },

  _onChangeWidth: function() {
    var margins = this._viewModel.get('margins');
    var histogramChartWidth = this._viewModel.get('width') - margins.left - margins.right;
    this._viewModel.set('histogramChartWidth', histogramChartWidth);

    if (this._chartView) {
      this._chartView.resize(histogramChartWidth);
    }
  },

  _onWindowResize: _.debounce(function() {
    // $el.width might not be available, e.g. if $el is not present in DOM yet
    // TODO width is not always accurate, because of other elements also resizing which affects this element
    this._viewModel.set('width', this.$el.width() || this.defaults.width);
  }, 50)

});
