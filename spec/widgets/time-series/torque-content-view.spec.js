var specHelper = require('../../spec-helper');
var TorqueTimesSeriesContentView = require('../../../src/widgets/time-series/torque-content-view');
var WidgetModel = require('../../../src/widgets/widget-model');
var HistogramChartView = require('../../../src/widgets/histogram/chart');

describe('widgets/time-series/torque-content-view', function () {
  function provideData () {
    var timeOffset = 10000;
    var startTime = (new Date()).getTime() - timeOffset;
    this.dataviewModel.fetch();
    this.options.success({
      bins_start: startTime,
      bin_width: timeOffset,
      bins_count: 3
    });
  }

  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.layerModel = vis.map.layers.first();
    this.layerModel.set('layer_name', '< & ><h1>Hello</h1>');
    var source = vis.analysis.findNodeById('a0');
    this.dataviewModel = vis.dataviews.createHistogramModel({
      column: 'col',
      source: source
    });

    spyOn(this.dataviewModel, 'fetch').and.callThrough();
    this.originalData = this.dataviewModel.getUnfilteredDataModel();
    this.originalData.set({
      data: [{ bin: 10 }, { bin: 3 }],
      start: 0,
      end: 256,
      bins: 2
    }, { silent: true });
    this.dataviewModel.sync = function (method, model, options) {
      this.options = options;
    }.bind(this);
    var widgetModel = new WidgetModel({
      normalized: false,
      show_source: true
    }, {
      dataviewModel: this.dataviewModel,
      layerModel: this.layerModel
    });

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    this.view = new TorqueTimesSeriesContentView({
      model: widgetModel
    });
  });

  it('should not fetch new data until unfilteredData is loaded', function () {
    expect(this.dataviewModel.fetch).not.toHaveBeenCalled();
    this.originalData.trigger('change:data', this.originalData);
    expect(this.dataviewModel.fetch).toHaveBeenCalled();
  });

  describe('when data is provided', function () {
    beforeEach(function () {
      provideData.call(this);
    });

    it('should render a time-slider', function () {
      expect(this.view.$('.CDB-TimeSlider').length).toEqual(1);
    });
  });

  describe('.render', function () {
    it('should create header, histogram, slider and dropdown views', function () {
      provideData.call(this);

      this.view.render();
      this.view.$('.js-actions').click();

      expect(this.view._headerView).toBeDefined();
      expect(this.view._histogramView).toBeDefined();
      expect(this.view._dropdownView).toBeDefined();
      expect(this.view.$('.js-torque-header').length).toBe(1);
      expect(this.view.$('.js-header .CDB-Dropdown').length).toBe(1);
      expect(this.view.$('.js-header .CDB-Widget-info').length).toBe(1);
      expect(this.view.$('.u-altTextColor').html()).toBe('&lt; &amp; &gt;&lt;h1&gt;Hello&lt;/h1&gt;');
      expect(this.view.$('svg').length).toBe(2);
      expect(this.view._histogramView.options.displayShadowBars).toBe(true);
      expect(this.view._histogramView.options.normalized).toBe(false);
    });

    it('should render the widget when the layer name changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      this.layerModel.set('layer_name', 'Hello');
      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
