var $ = require('jquery');
var _ = require('underscore');
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

    _.bindAll(this, '_onWindowResize');
    $(window).bind('resize', this._onWindowResize);

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
  },

  _onWindowResize: _.debounce(function() {
    var width = this.$el.width() || 0;

    // $el.width might not be available, e.g. if $el is not present in DOM yet
    // TODO width is not always accurate, because of other elements also resizing which affects this element
    this._viewModel.set('width', width);
    if (this._chartView) {
      this._chartView.resize(width);
    }
  }, 50)

});
