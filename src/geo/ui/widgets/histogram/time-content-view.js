var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var WidgetContentView = require('../standard/widget_content_view.js');
var HistogramChartView = require('./chart');
var placeholderTemplate = require('./placeholder.tpl');

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
