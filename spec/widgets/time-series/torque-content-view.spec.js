var cdb = require('cartodb.js');
var TorqueTimesSeriesContentView = require('../../../src/widgets/time-series/torque-content-view');
var WidgetModel = require('../../../src/widgets/widget-model');

describe('widgets/time-series/torque-content-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      layers: [{type: 'torque'}]
    });
    this.dataviewModel = vis.dataviewsFactory.createHistogramDataview(vis.map.layers.first(), {});
    this.dataviewModel.sync = function (method, model, options) {
      this.options = options;
    }.bind(this);
    this.torqueLayerModel = new cdb.geo.TorqueLayer({
    });
    this.model = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new TorqueTimesSeriesContentView({
      model: this.model
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
