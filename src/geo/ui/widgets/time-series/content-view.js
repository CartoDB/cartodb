var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var WidgetContentView = require('../standard/widget_content_view.js');
var HistogramChartView = require('../histogram/chart');
var placeholderTemplate = require('../histogram/placeholder.tpl');

/**
 * Widget view representing a histogram of date/time-series.
 */
module.exports = WidgetContentView.extend({

  defaults: {
    width: 400
  },

  initialize: function() {
    WidgetContentView.prototype.initialize.apply(this, arguments);
    _.bindAll(this, '_onWindowResize');
    $(window).bind('resize', this._onWindowResize);

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
  },

  _initBinds: function() {
    // TODO overrides parent view's private function, can we remove this and have things more clear?
    this.model.once('change:data', this.render, this);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(''); // to remove placeholder if there is any

    if (this._isDataEmpty()) {
      this.$el.append(placeholderTemplate());
    } else {
      this._createHistogramView();
    }

    this._onWindowResize();

    return this;
  },

  clean: function() {
    $(window).unbind('resize', this._onWindowResize);
    View.prototype.clean.call(this);
  },

  _createHistogramView: function() {
    this.histogramChartView = new HistogramChartView({
      y: 0,
      margin: {
        top: 4,
        right: 4,
        bottom: 20,
        left: 4
      },
      handles: true,
      width: this._histogramChartWidth(),
      height: this.viewModel.get('histogramChartHeight'),
      data: this.model.getData(),
      xAxisTickFormat: function(d, i) {
        return i;
      }
    });
    this._appendView(this.histogramChartView);
    this.histogramChartView.bind('on_brush_end', this._onBrushEnd, this);
    this.histogramChartView.show();
  },

  _onBrushEnd: function(loBarIndex, hiBarIndex) {
    var data = this.model.getData();
    this._setRange(
      data[loBarIndex].start,
      data[hiBarIndex - 1].end
    );
  },

  _setRange: function(start, end) {
    this.filter.setRange({ min: start, max: end });
  },

  _appendView: function(view) {
    this.addView(view);
    this.$el.append(view.el);
    view.render();
  },

  _onChangeWidth: function() {
    if (this.histogramChartView) {
      this.histogramChartView.resize(this._histogramChartWidth());
    }
  },

  _histogramChartWidth: function() {
    var margins = this.viewModel.get('margins');
    return this.viewModel.get('width') - margins.left - margins.right;
  },

  _isDataEmpty: function() {
    var data = this.model.getData();
    return _.isEmpty(data) || _.size(data) === 0;
  },

  _onWindowResize: _.debounce(function() {
    // $el.width might not be available, e.g. if $el is not present in DOM yet
    // TODO width is not always accurate, because of other elements also resizing which affects this element
    this.viewModel.set('width', this.$el.width() || this.defaults.width);
  }, 50)

});
