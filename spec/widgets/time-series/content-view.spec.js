var specHelper = require('../../spec-helper');
var TimeSeriesContentView = require('../../../src/widgets/time-series/content-view');
var WidgetModel = require('../../../src/widgets/widget-model');
var HistogramChartView = require('../../../src/widgets/histogram/chart');

describe('widgets/time-series/content-view', function () {
  var view, widgetModel, layerModel, dataviewModel, originalData;
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

    view = new TimeSeriesContentView({
      model: widgetModel
    });

    return view;
  };

  describe('when widget has data', function () {
    describe('.render', function () {
      it('should render properly', function () {
        view = createViewFn();
        view.render();

        expect(view.$('.js-header').length).toBe(1);
        expect(view.$('.js-title').length).toBe(1);
        expect(view.$('.js-content').length).toBe(1);
        expect(view.$('.CDB-Widget-info').length).toBe(0);
        expect(view._histogramView).toBeDefined();
        expect(view._headerView).toBeDefined();
        expect(view._dropdownView).toBeDefined();
        expect(view.render().$el.html()).toContain('<svg');
      });
    });

    describe('when show_source is true', function () {
      var tableName = 'table_name';
      var sourceType = 'sampling';
      var layerName = 'Test Layer Name';

      beforeEach(function () {
        view = createViewFn();
        widgetModel.set({
          show_source: true,
          table_name: tableName
        });
      });

      describe('when dataViewModel is sourceType', function () {
        describe('.render', function () {
          it('should render properly', function () {
            view.render();

            expect(view.$('.CDB-Widget-info').length).toBe(1);
            expect(view.$el.html()).toContain(nodeId);
            expect(view.$el.html()).toContain('Source');
            expect(view.$el.html()).toContain(tableName);
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
            view.render();

            expect(view.$('.CDB-Widget-info').length).toBe(1);
            expect(view.$('.CDB-IconFont-ray').length).toBe(1);
            expect(view.$el.html()).toContain(nodeId);
            expect(view.$el.html()).toContain('Sampling');
            expect(view.$el.html()).toContain(layerName);
          });
        });
      });
    });
  });

  describe('when wiget has no data', function () {
    beforeEach(function () {
      view = createViewFn();
      originalData.set('data', [], { silent: true });
      view.render();
    });

    describe('.render', function () {
      it('should render placeholder', function () {
        expect(view.$el.html()).not.toBe('');
        expect(view.$('.CDB-Widget-content--timeSeries').length).toBe(1);
      });

      it('should not render chart just yet since there is no data', function () {
        expect(view.$el.html()).not.toContain('<svg');
      });
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should hook up events properly', function () {
      view.model.off();
      spyOn(view, 'render');

      view._initBinds();

      // DataviewModel events
      view.model.trigger('change:hasInitialState');
      expect(view.render).toHaveBeenCalled();
    });

    it('should render the widget when the layer name changes', function () {
      spyOn(view, 'render');
      view._initBinds();
      layerModel.set('layer_name', 'Hello');
      expect(view.render).toHaveBeenCalled();
    });
  });
});
