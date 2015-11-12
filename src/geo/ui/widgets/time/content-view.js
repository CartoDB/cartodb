var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var WidgetContentView = require('../standard/widget_content_view.js');
var ControlsView = require('./controls-view');
var StepInfoView = require('./step-info-view');
var HistogramChartView = require('../histogram/chart');

/**
 * View representing a time-series widget
 * Expects a model that have the following attrs:
 *  - data: an array of bins, where each item contains {freq, start, end}
 *  - step: if present, controls the current time item being rendered
 */
module.exports = WidgetContentView.extend({

  defaults: {
    width: 400
  },

  initialize: function() {
    _.bindAll(this, '_onWindowResize');
    $(window).bind('resize', this._onWindowResize);

    this.model.bind('change:data', this.render, this);

    this.viewModel = new Model({
      width: this.defaults.width,
      margins: { // TODO could be calculated from element styles instead of duplicated numbers here?
        top: 0,
        right: 24,
        bottom: 0,
        left: 24
      },
      histogramChartHeight:
        48 // inline bars height
        + 20 // bottom labels
        + 4 // margins
    });
    this.add_related_model(this.viewModel);
    this.viewModel.bind('change:width', this._onChangeWidth, this);
  },

  render: function() {
    this.clearSubViews();
    this._appendView(
      new ControlsView({
        model: this.model
      })
    );
    this._appendView(
      new StepInfoView({
        model: this.model
      })
    );

    if (this.model.get('data')) {
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
      data: this.model.get('data'),
      xAxisTickFormat: function(d, i) {
        return i;
      }
    });
    this._appendView(this.histogramChartView);
    this.histogramChartView.show();
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

  _onWindowResize: _.debounce(function() {
    // $el.width might not be available, e.g. if $el is not present in DOM yet
    // TODO width is not always accurate, because of other elements also resizing which affects this element
    this.viewModel.set('width', this.$el.width() || this.defaults.width);
  }, 50)

});
