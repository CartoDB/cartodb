var Backbone = require('backbone');
var TorqueHistogramView = require('../../../../../javascripts/deep-insights/widgets/time-series/torque-histogram-view');
var specHelper = require('../../spec-helper');
var HistogramChartView = require('../../../../../javascripts/deep-insights/widgets/histogram/chart');
var HistogramView = require('../../../../../javascripts/deep-insights/widgets/time-series/histogram-view');
var TorqueLayer = require('internal-carto.js/src/geo/map/torque-layer');

describe('widgets/time-series/torque-histogram-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();

    this.layerModel = vis.map.layers.first();

    this.timeSeriesModel = new Backbone.Model();
    this.timeSeriesModel.getWidgetColor = function () {};

    var source = vis.analysis.findNodeById('a0');
    this.dataviewModel = vis.dataviews.createHistogramModel({
      column: 'dates',
      bins: 256,
      source: source
    });
    this.dataviewModel.set({
      start: 0,
      end: 1
    });

    this.torqueLayerModel = new TorqueLayer({
      isRunning: false,
      step: 0,
      steps: 256,
      start: 0,
      end: 1000
    }, {
      engine: vis.getEngine()
    });

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    this.view = new TorqueHistogramView({
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel,
      timeSeriesModel: this.timeSeriesModel,
      model: this.dataviewModel,
      rangeFilter: this.dataviewModel.filter,
      torqueLayerModel: this.torqueLayerModel,
      displayShadowBars: false,
      normalized: true
    });
    this.view.render();
  });

  describe('._onBrushClick', function () {
    it('should set torque layer step', function () {
      spyOn(HistogramView.prototype, 'resetFilter');

      this.view._onBrushClick(0.5);

      expect(HistogramView.prototype.resetFilter).toHaveBeenCalled();
      expect(this.torqueLayerModel.get('step')).toBe(128);
    });
  });

  describe('_timeToStep', function () {
    var prevStart;
    var prevEnd;
    var prevSteps;

    beforeEach(function () {
      prevSteps = this.view._torqueLayerModel.get('steps');
      prevStart = this.view._torqueLayerModel.get('start');
      prevEnd = this.view._torqueLayerModel.get('end');
    });

    afterEach(function () {
      this.view._torqueLayerModel.get(prevSteps);
      this.view._torqueLayerModel.set(prevStart);
      this.view._torqueLayerModel.set(prevEnd);
    });

    it('should return first and last steps if start and end are equal', function () {
      this.view._torqueLayerModel.set({
        steps: 5,
        start: 2,
        end: 2
      }, { silent: true });

      var minStep = this.view._timeToStep(45, 'min');
      var maxStep = this.view._timeToStep(45, 'max');

      expect(minStep).toBe(0);
      expect(maxStep).toBe(5);
    });
  });
});
