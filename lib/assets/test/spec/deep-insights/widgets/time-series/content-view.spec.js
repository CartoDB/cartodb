var specHelper = require('../../spec-helper');
var TimeSeriesContentView = require('../../../../../javascripts/deep-insights/widgets/time-series/content-view');
var WidgetModel = require('../../../../../javascripts/deep-insights/widgets/widget-model');
var HistogramChartView = require('../../../../../javascripts/deep-insights/widgets/histogram/chart');

describe('widgets/time-series/content-view', function () {
  var widgetModel, layerModel, dataviewModel, originalData;
  var nodeId = 'a0';

  var createViewFn = function (options) {
    var vis = specHelper.createDefaultVis();
    var source = vis.analysis.findNodeById(nodeId);

    layerModel = vis.map.layers.first();

    dataviewModel = vis.dataviews.createHistogramModel({
      column: 'col',
      source: source
    });
    spyOn(dataviewModel, 'fetch').and.callThrough();

    originalData = dataviewModel.getUnfilteredDataModel();
    originalData.set({
      data: [{ bin: 10 }, { bin: 3 }],
      start: 0,
      end: 256,
      bins: 2
    });

    widgetModel = new WidgetModel({
      show_source: false
    }, {
      dataviewModel: dataviewModel,
      layerModel: layerModel
    });

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    var view = new TimeSeriesContentView({
      model: widgetModel
    });

    return view;
  };

  describe('when widget has data', function () {
    describe('.render', function () {
      it('should render properly', function () {
        this.view = createViewFn();
        this.view.render();

        expect(this.view.$('.js-header').length).toBe(1);
        expect(this.view.$('.js-title').length).toBe(1);
        expect(this.view.$('.js-content').length).toBe(1);
        expect(this.view.$('.CDB-Widget-info').length).toBe(0);
        expect(this.view._histogramView).toBeDefined();
        expect(this.view._headerView).toBeDefined();
        expect(this.view._dropdownView).toBeDefined();
        expect(this.view.render().$el.html()).toContain('<svg');
      });
    });

    describe('when show_source is true', function () {
      var tableName = 'table_name';
      var sourceType = 'sampling';
      var layerName = 'Test Layer Name';

      beforeEach(function () {
        this.view = createViewFn();
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
        expect(this.view.$('.CDB-Widget-content--timeSeries').length).toBe(1);
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

    it('should hook up events properly', function () {
      this.view.model.off();
      spyOn(this.view, 'render');

      this.view._initBinds();

      // Datathis.viewModel events
      this.view.model.trigger('change:hasInitialState');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should render the widget when the layer name changes', function () {
      spyOn(this.view, 'render');
      this.view._initBinds();
      layerModel.set('layer_name', 'Hello');
      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
