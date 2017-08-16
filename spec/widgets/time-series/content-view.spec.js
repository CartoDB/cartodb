var specHelper = require('../../spec-helper');
var TimeSeriesContentView = require('../../../src/widgets/time-series/content-view');
var WidgetModel = require('../../../src/widgets/widget-model');
var HistogramChartView = require('../../../src/widgets/histogram/chart');

describe('widgets/time-series/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      column: 'col',
      source: {
        id: 'a0'
      }
    });
    this.originalData = this.dataviewModel.getUnfilteredDataModel();
    this.originalData.set({
      data: [{ bin: 10 }, { bin: 3 }],
      start: 0,
      end: 256,
      bins: 2
    });
    this.dataviewModel.sync = function (method, dataviewModel, options) {
      this.options = options;
    }.bind(this);

    var widgetModel = new WidgetModel({
      show_source: true
    }, {
      dataviewModel: this.dataviewModel
    });

    spyOn(HistogramChartView.prototype, '_setupFillColor').and.returnValue('red');

    spyOn(this.dataviewModel, 'fetch').and.callThrough();
    this.view = new TimeSeriesContentView({
      model: widgetModel
    });
  });

  describe('.render', function () {
    describe('with data', function () {
      beforeEach(function () {
        this.originalData.set('data', [], { silent: true });
        this.view.render();
      });

      it('should render placeholder', function () {
        expect(this.view.$el.html()).not.toBe('');
        expect(this.view.$('.CDB-Widget-content--timeSeries').length).toBe(1);
      });

      it('should not render chart just yet since have no data', function () {
        expect(this.view.$el.html()).not.toContain('<svg');
      });
    });

    describe('without data', function () {
      beforeEach(function () {
        var timeOffset = 10000;
        var startTime = (new Date()).getTime() - timeOffset;

        this.dataviewModel.fetch();
        this.options.success({
          bins_count: 3,
          bin_width: 100,
          nulls: 0,
          bins_start: 10,
          bins: [{
            start: startTime,
            end: startTime + timeOffset,
            freq: 3
          }]
        });
      });

      it('should render chart', function () {
        this.view.render();

        expect(this.view.$('.js-header').length).toBe(1);
        expect(this.view.$('.js-content').length).toBe(1);
        expect(this.view._histogramView).toBeDefined();
        expect(this.view._headerView).toBeDefined();
        expect(this.view._dropdownView).toBeDefined();
        expect(this.view.$('.js-header .CDB-Widget-info').length).toBe(1);
        expect(this.view.render().$el.html()).toContain('<svg');
      });
    });
  });

  describe('.initBinds', function () {
    it('should hook up events properly', function () {
      this.view._dataviewModel.off();
      spyOn(this.view, 'render');

      this.view._initBinds();

      // DataviewModel events
      this.view._dataviewModel.trigger('change:data');
      expect(this.view.render).toHaveBeenCalled();
    });
  });
});
