var specHelper = require('../../spec-helper');
var TorqueTimesSeriesContentView = require('../../../src/widgets/time-series/torque-content-view');
var WidgetModel = require('../../../src/widgets/widget-model');

describe('widgets/time-series/torque-content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      column: 'col'
    });
    this.dataviewModel.sync = function (method, model, options) {
      this.options = options;
    }.bind(this);
    this.torqueLayerModel = new cdb.geo.TorqueLayer({
    });
    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new TorqueTimesSeriesContentView({
      model: widgetModel
    });
    this.renderResult = this.view.render();
  });

  it('should render loading state', function () {
    expect(this.renderResult).toBe(this.view);
  });

  describe('when data is provided', function () {
    beforeEach(function () {
      var timeOffset = 10000;
      var startTime = (new Date()).getTime() - timeOffset;
      this.dataviewModel.fetch();
      this.options.success({
        bins: [{
          start: startTime,
          end: startTime + timeOffset,
          freq: 3
        }]
      });
    });

    it('should render a time-slider', function () {
      expect(this.view.$('.CDB-TimeSlider').length).toEqual(1);
    });
  });
});
