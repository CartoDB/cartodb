var specHelper = require('../../spec-helper');
var TorqueTimesSeriesContentView = require('../../../src/widgets/time-series/torque-content-view');
var WidgetModel = require('../../../src/widgets/widget-model');
var cdb = require('cartodb.js');

describe('widgets/time-series/torque-content-view', function () {
  beforeEach(function () {
    var vis = specHelper.createDefaultVis();
    this.dataviewModel = vis.dataviews.createHistogramModel(vis.map.layers.first(), {
      column: 'col'
    });
    spyOn(this.dataviewModel, 'fetch').and.callThrough();
    this.originalData = this.dataviewModel.getUnfilteredDataModel();
    this.originalData.set({
      data: [{ bin: 10 }, { bin: 3 }],
      start: 0,
      end: 256,
      bins: 2
    });
    this.dataviewModel.sync = function (method, model, options) {
      this.options = options;
    }.bind(this);
    this.torqueLayerModel = new cdb.geo.TorqueLayer();
    var widgetModel = new WidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
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
