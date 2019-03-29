var specHelper = require('../../spec-helper');
var TorqueTimesSeriesContentView = require('../../../../../javascripts/deep-insights/widgets/time-series/torque-content-view');
var WidgetModel = require('../../../../../javascripts/deep-insights/widgets/widget-model');
var HistogramChartView = require('../../../../../javascripts/deep-insights/widgets/histogram/chart');

describe('widgets/time-series/torque-content-view', function () {
  var widgetModel, layerModel, dataviewModel, originalData, syncOptions;
  var nodeId = 'a0';

  function provideData () {
    var timeOffset = 10000;
    var startTime = (new Date()).getTime() - timeOffset;
    dataviewModel.fetch();
    syncOptions.success({
      bins_start: startTime,
      bin_width: timeOffset,
      bins_count: 3
    });
  }

  var createViewFn = function (options) {
    var vis = specHelper.createDefaultVis();
    var source = vis.analysis.findNodeById(nodeId);

    layerModel = vis.map.layers.first();

    dataviewModel = vis.dataviews.createHistogramModel({
      column: 'col',
      source: source
    });
    dataviewModel.sync = function (method, model, options) {
      syncOptions = options;
    };
    spyOn(dataviewModel, 'fetch').and.callThrough();

    originalData = dataviewModel.getUnfilteredDataModel();
    originalData.set({
      data: [{ bin: 10 }, { bin: 3 }],
      start: 0,
      end: 256,
      bins: 2
    }, { silent: true });

    widgetModel = new WidgetModel({
      normalized: false,
      show_source: false
    }, {
      dataviewModel: dataviewModel,
      layerModel: layerModel
    });

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    var view = new TorqueTimesSeriesContentView({
      model: widgetModel
    });

    return view;
  };

  it('should not fetch new data until unfilteredData is loaded', function () {
    this.view = createViewFn();
    expect(dataviewModel.fetch).not.toHaveBeenCalled();
    originalData.trigger('change:data', originalData);
    expect(dataviewModel.fetch).toHaveBeenCalled();
  });

  describe('.render', function () {
    beforeEach(function () {
      this.view = createViewFn();
      provideData();
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.js-header').length).toBe(1);
      expect(this.view.$('.js-torque-header').length).toBe(1);
      expect(this.view.$('.CDB-Widget-content--torqueTimeSeries').length).toBe(1);
      expect(this.view.$('.CDB-Widget-info').length).toBe(0);
      expect(this.view._histogramView).toBeDefined();
      expect(this.view._headerView).toBeDefined();
      expect(this.view._dropdownView).toBeDefined();
      expect(this.view._histogramView.options.displayShadowBars).toBe(true);
      expect(this.view._histogramView.options.normalized).toBe(false);
    });

    it('should render the actions dropdown', function () {
      this.view.$('.js-actions').click();
      expect(this.view.$('.js-header .CDB-Dropdown').length).toBe(1);
    });
  });

  describe('when widget has data', function () {
    beforeEach(function () {
      this.view = createViewFn();
      provideData();
    });

    describe('.render', function () {
      it('should render properly', function () {
        this.view.render();

        expect(this.view.$('.CDB-TimeSlider').length).toEqual(1);
        expect(this.view.render().$el.html()).toContain('<svg');
      });
    });

    describe('when show_source is true', function () {
      var tableName = 'table_name';
      var sourceType = 'sampling';
      var layerName = 'Test Layer Name';

      beforeEach(function () {
        widgetModel.set({
          show_source: true,
          table_name: tableName
        });
      });

      describe('when dataViewModel is sourceType', function () {
        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$('.CDB-Widget-info').length).toBe(1);
            expect(this.view.$el.html()).toContain(nodeId);
            expect(this.view.$el.html()).toContain('Source');
            expect(this.view.$el.html()).toContain(tableName);
          });
        });
      });

      describe('when dataViewModel is not sourceType', function () {
        beforeEach(function () {
          spyOn(dataviewModel, 'getSourceType').and.returnValue(sourceType);
          spyOn(dataviewModel, 'isSourceType').and.returnValue(false);
          layerModel.set('layer_name', layerName, { silent: true });
        });

        describe('.render', function () {
          it('should render properly', function () {
            this.view.render();

            expect(this.view.$('.CDB-Widget-info').length).toBe(1);
            expect(this.view.$('.CDB-IconFont-ray').length).toBe(1);
            expect(this.view.$el.html()).toContain(nodeId);
            expect(this.view.$el.html()).toContain('Subsample');
            expect(this.view.$el.html()).toContain(layerName);
          });
        });
      });
    });
  });

  describe('when wiget has no data', function () {
    beforeEach(function () {
      this.view = createViewFn();
      originalData.set('data', [], { silent: true });
      this.view.render();
    });

    describe('.render', function () {
      it('should render placeholder', function () {
        expect(this.view.$el.html()).not.toBe('');
        expect(this.view.$('.CDB-Widget-timeSeriesFakeControl').length).toBe(1);
        expect(this.view.$('.CDB-Widget-timeSeriesFakeChart').length).toBe(1);
      });

      it('should not render chart just yet since there is no data', function () {
        expect(this.view.$el.html()).not.toContain('<svg');
      });
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      this.view = createViewFn();
    });

    it('should call _onOriginalDataChange the originalData change:data', function () {
      spyOn(this.view, '_onOriginalDataChange');
      this.view._initBinds();
      originalData.trigger('change:data');
      expect(this.view._onOriginalDataChange).toHaveBeenCalled();
    });

    it('should render when dataviewModel change:data', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      dataviewModel.trigger('change:data');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should all _onChangeBins when dataviewModel change:bins', function () {
      spyOn(this.view, '_onChangeBins');
      this.view._initBinds();
      dataviewModel.trigger('change:bins');
      expect(this.view._onChangeBins).toHaveBeenCalled();
    });

    it('should render the widget when the layer name changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      layerModel.set('layer_name', 'Hello');
      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
