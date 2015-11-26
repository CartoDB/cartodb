var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var HistogramChartView = require('../histogram/chart');

/**
 * Time-series histogram view.
 */
module.exports = View.extend({

  className: 'Widget-content Widget-content--timeSeries',

  defaults: {
    width: 400
  },

  initialize: function() {
    _.bindAll(this, '_onWindowResize');
    $(window).bind('resize', this._onWindowResize);

    this.filter = this.options.filter;

    this.viewModel = new Model({
      width: this.defaults.width,
      margins: { // TODO could be calculated from element styles instead of duplicated numbers here?
        top: 0,
        right: 24,
        bottom: 0,
        left: 24
      },
      histogramChartHeight:
        48 + // inline bars height
        20 + // bottom labels
        4 // margins
    });
    this.add_related_model(this.viewModel);
    this.viewModel.bind('change:width', this._onChangeWidth, this);

    this.model.bind('change:data', this._onChangeData, this);
  },

  _onChangeData: function() {
    if (this.chartView) {
      this.chartView.replaceData(this.model.getData());
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
    this.chartView = new HistogramChartView({
      type: 'time',
      animationSpeed: 100,
      margin: {
        top: 4,
        right: 4,
        bottom: 20,
        left: 4
      },
      handles: true,
      delayBar: function(d, i) {
        return 100 + (i * 10);
      },
      width: this._histogramChartWidth(),
      height: this.viewModel.get('histogramChartHeight'),
      data: this.model.getData()
    });
    this.addView(this.chartView);
    this.$el.append(this.chartView.render().el);
    this.chartView.bind('on_brush_end', this._onBrushEnd, this);
    this.chartView.show();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this.filter.setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
  },

  _onChangeWidth: function() {
    if (this.chartView) {
      this.chartView.resize(this._histogramChartWidth());
    }
  },

  _histogramChartWidth: function() {
    var margins = this.viewModel.get('margins');
    return this.viewModel.get('width') - margins.left - margins.right;
  },

  _onWindowResize: _.debounce(function() {
    // $el.width might not be available, e.g. if $el is not present in DOM yet
    // TODO width is not always accurate, because of other elements also resizing which affects this element
    this.viewModel.set('width', this.$el.width() || this.defaults.width);
  }, 50)

});
