var cdb = require('cartodb.js');
var TimeSeriesContentView = require('../../../src/widgets/time-series/content-view');
var WidgetModel = require('../../../src/widgets/widget-model');

describe('widgets/time-series/content-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviews.createHistogramDataview(vis.map.layers.first(), {});
    this.dataviewModel.sync = function (method, dataviewModel, options) {
      this.options = options;
    }.bind(this);

    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });

    this.view = new TimeSeriesContentView({
      model: widgetModel
    });

    this.view.render();
  });

  it('should render', function () {
    expect(this.view.$el.html()).not.toEqual('');
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
