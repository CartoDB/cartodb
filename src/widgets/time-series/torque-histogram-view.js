var _ = require('underscore');
var HistogramView = require('./histogram-view');
var TorqueTimeSliderView = require('./torque-time-slider-view');
var TorqueControlsView = require('./torque-controls-view');

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 * this.dataviewModel is a histogram model
 */
module.exports = HistogramView.extend({
  className: function () {
    return HistogramView.prototype.className + ' CDB-Widget-content CDB-Widget-content--torqueTimeSeries u-flex';
  },

  initialize: function () {
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');
    if (!this.options.rangeFilter) throw new Error('rangeFilter is required');
    if (!this.options.dataviewModel) throw new Error('dataviewModel is required');
    if (!this.options.timeSeriesModel) throw new Error('timeSeriesModel is required');

    this._torqueLayerModel = this.options.torqueLayerModel;
    this._dataviewModel = this.options.dataviewModel;
    this._timeSeriesModel = this.options.timeSeriesModel;
    HistogramView.prototype.initialize.call(this);
  },

  _initBinds: function () {
    HistogramView.prototype._initBinds.call(this);

    this.listenTo(this._torqueLayerModel, 'change:renderRange', this._onRenderRangeChanged);
    this.listenTo(this._torqueLayerModel, 'change:steps change:start change:end', this._reSelectRange);
    this.listenTo(this._torqueLayerModel, 'change:cartocss', this._onUpdateCartocss);
  },

  _createHistogramView: function () {
    this._chartType = this._torqueLayerModel.get('column_type') === 'date' ? 'time' : 'number';
    HistogramView.prototype._createHistogramView.call(this);

    this._torqueControls = new TorqueControlsView({
      torqueLayerModel: this._torqueLayerModel,
      rangeFilter: this._rangeFilter
    });
    this.addView(this._torqueControls);

    this.$el.prepend(this._torqueControls.render().el);

    this._chartView.setAnimated();
    this._chartView.bind('on_brush_click', this._onBrushClick, this);

    this._timeSliderView = new TorqueTimeSliderView({
      dataviewModel: this._dataviewModel, // a histogram model
      chartView: this._chartView,
      torqueLayerModel: this._torqueLayerModel,
      timeSeriesModel: this._timeSeriesModel,
      rangeFilter: this._rangeFilter
    });
    this.addView(this._timeSliderView);
    this._timeSliderView.render();
  },

  _onChangeData: function () {
    HistogramView.prototype._onChangeData.call(this);

    if (this._chartView) {
      this._reSelectRange();
    }
  },

  _onRenderRangeChanged: function (_model, range) {
    if (range.start === undefined && range.end === undefined) {
      this._chartView.removeSelection();
      this._rangeFilter.unsetRange();
    }
  },

  _onBrushClick: function (indexPct) {
    var steps = this._torqueLayerModel.get('steps');
    var step = Math.round(steps * indexPct);

    // Going to the last step causes a jump to the beginning immediately
    if (step === steps) step -= 1;

    HistogramView.prototype.resetFilter.apply(this);

    this._torqueLayerModel.set({ step: step });
  },

  _onBrushEnd: function () {
    HistogramView.prototype._onBrushEnd.apply(this, arguments);
    this._reSelectRange();
  },

  _timeToStep: function (timestamp) {
    var steps = this._torqueLayerModel.get('steps');
    var start = this._torqueLayerModel.get('start');
    var end = this._torqueLayerModel.get('end');
    var step = (steps * (1000 * timestamp - start)) / (end - start);
    return step;
  },

  _reSelectRange: function () {
    if (!this._rangeFilter.isEmpty()) {
      this._torqueLayerModel.pause();

      var min = this._rangeFilter.get('min');
      var max = this._rangeFilter.get('max');
      var loStep = this._timeToStep(min);
      var hiStep = this._timeToStep(max);

      // -- HACK: Reset filter if the min/max values are out of the scope
      var data = this._dataviewModel.get('data');
      var loBar = _.findWhere(data, { start: min });
      var hiBar = _.findWhere(data, { end: max });
      if (!loBar || !hiBar) {
        return this._torqueLayerModel.resetRenderRange();
      }

      // clamp values since the range can be outside of the current torque thing
      var steps = this._torqueLayerModel.get('steps');
      var ratio = this._chartView.getSelectionExtent() / 100;
      this._updateDuration(ratio);
      this._torqueLayerModel.renderRange(
        this._clampRangeVal(0, steps, loStep), // start
        this._clampRangeVal(0, steps, hiStep) // end
      );
    } else {
      this._torqueLayerModel.play();
      this._updateDuration(1);
    }
  },

  _updateDuration: function (ratio, cartocss) {
    if (!this._torqueLayerModel.getAnimationDuration) return;
    var duration = this._torqueLayerModel.getAnimationDuration(cartocss || this._torqueLayerModel.get('cartocss'));

    this._torqueLayerModel.set('customDuration', Math.round(duration * ratio));
  },

  _onUpdateCartocss: function (m, cartocss) {
    var ratio;
    if (!this._rangeFilter.isEmpty()) {
      var loStep = this._timeToStep(this._rangeFilter.get('min'));
      var hiStep = this._timeToStep(this._rangeFilter.get('max'));
      var steps = this._torqueLayerModel.get('steps');
      ratio = (hiStep - loStep) / steps;
    } else {
      ratio = 1;
    }

    // Update silently, when carto.js updates the cartoCSS for torque, it will apply the new duration.
    this._updateDuration(ratio, cartocss, { silent: true });
  },

  _clampRangeVal: function (a, b, t) {
    return Math.max(a, Math.min(b, t));
  },

  _getMarginLeft: function () {
    return 16;
  }
});
