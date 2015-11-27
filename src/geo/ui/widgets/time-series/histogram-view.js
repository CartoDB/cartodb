var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var HistogramChartView = require('../histogram/chart');

/**
 * Time-series histogram view.
 */
module.exports = View.extend({

  className: 'Widget-content Widget-content--timeSeries',

  initialize: function() {
    this.filter = this.options.filter;

    this.viewModel = new Model({
      margins: { // TODO could be calculated from element styles instead of duplicated numbers here?
        top: 0,
        right: 0,
        bottom: 0,
        left: 24
      },
      histogramChartHeight:
        48 + // inline bars height
        20 + // bottom labels
        4 // margins
    });

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
    return this;
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
  }

});
