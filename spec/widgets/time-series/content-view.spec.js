var specHelper = require('../../spec-helper');
var TimeSeriesContentView = require('../../../src/widgets/time-series/content-view');
var WidgetModel = require('../../../src/widgets/widget-model');

describe('widgets/time-series/content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      column: 'col'
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

    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });

    spyOn(this.dataviewModel, 'fetch').and.callThrough();
    this.view = new TimeSeriesContentView({
      model: widgetModel
    });

  });

  it('should not fetch new data until unfilteredData is loaded', function () {
    expect(this.dataviewModel.fetch).not.toHaveBeenCalled();
    this.originalData.trigger('change:data', this.originalData);
    expect(this.dataviewModel.fetch).toHaveBeenCalled();
  });

  describe('when unfilteredData is loaded', function () {
    beforeEach(function () {
      this.originalData.trigger('change:data', this.originalData);
      this.dataviewModel.trigger('change:data');
    });

    it('should render placeholder', function () {
      expect(this.view.$el.html()).not.toBe('');
      expect(this.view.$('.CDB-Widget-content--timeSeries').length).toBe(1);
    });

    it('should not render chart just yet since have no data', function () {
      expect(this.view.$el.html()).not.toContain('<svg');
    });

    describe('when data is provided', function () {
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
        expect(this.view.render().$el.html()).toContain('<svg');
      });
    });
  });
});
