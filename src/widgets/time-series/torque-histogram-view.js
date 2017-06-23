var HistogramView = require('./histogram-view');
var TorqueTimeSliderView = require('./torque-time-slider-view');

/**
 * Torque time-series histogram view.
 * Extends the common histogram chart view with time-control
 * this.model is a histogram model
 */
module.exports = HistogramView.extend({
  className: 'CDB-Widget-content CDB-Widget-content--timeSeries',

  initialize: function () {
    if (!this.options.torqueLayerModel) throw new Error('torqeLayerModel is required');
    if (!this.options.rangeFilter) throw new Error('rangeFilter is required');

    this._torqueLayerModel = this.options.torqueLayerModel;
    HistogramView.prototype.initialize.call(this);
  },

  _initBinds: function () {
    HistogramView.prototype._initBinds.call(this);

    this._torqueLayerModel.bind('change:renderRange', this._onRenderRangeChanged, this);
    this._torqueLayerModel.bind('change:steps change:start change:end', this._reSelectRange, this);
    this.add_related_model(this._torqueLayerModel);
  },

  _createHistogramView: function () {
    this._chartType = this._torqueLayerModel.get('column_type') === 'date' ? 'time' : 'number';
    HistogramView.prototype._createHistogramView.call(this);
    this._chartView.bind('on_brush_click', this._onBrushClick, this);

    var timeSliderView = new TorqueTimeSliderView({
      dataviewModel: this.model, // a histogram model
      chartView: this._chartView,
      torqueLayerModel: this._torqueLayerModel
    });
    this.addView(timeSliderView);
    timeSliderView.render();
  },

  _onChangeData: function () {
    HistogramView.prototype._onChangeData.call(this);

    if (this._chartView) {
      this._reSelectRange();
    }
  },

  _onRenderRangeChanged: function (m, r) {
    if (r.start === undefined && r.end === undefined) {
      this._chartView.removeSelection();
      this._rangeFilter.unsetRange();
    }
  },

  _onBrushClick: function (loBarIndex) {
    // when there are fewer data entries than the expected steps the torqueLayerModel has wrong number of steps,
    // thus we need to calculate the "proper" step, this is a hack
    var dataLength = this.model.get('data').length;
    var steps = this._torqueLayerModel.get('steps');
    var step = steps < dataLength ? loBarIndex * steps / dataLength : loBarIndex;

    HistogramView.prototype.resetFilter.apply(this);

    this._torqueLayerModel.set({ step: step });
  },

  _onBrushEnd: function (loBarIndex, hiBarIndex) {
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
      var loStep = this._timeToStep(this._rangeFilter.get('min'));
      var hiStep = this._timeToStep(this._rangeFilter.get('max'));

      // clamp values since the range can be outside of the current torque thing
      var steps = this._torqueLayerModel.get('steps');
      this._torqueLayerModel.renderRange(
        this._clampRangeVal(0, steps, loStep), // start
        this._clampRangeVal(0, steps, hiStep) // end
      );
    }
  },

  _clampRangeVal: function (a, b, t) {
    return Math.max(a, Math.min(b, t));
  }
});
