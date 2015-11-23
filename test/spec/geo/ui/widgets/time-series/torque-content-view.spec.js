var HistogramModel = require('cdb/geo/ui/widgets/histogram/model');
var TorqueLayerModel = require('cdb/geo/map/torque-layer');
var TimeContentView = require('cdb/geo/ui/widgets/time-series/torque-content-view');

describe('geo/ui/widgets/time-series/torque-content-view', function() {
  beforeEach(function() {
    this.model = new HistogramModel();
    this.model.sync = function(method, model, options) {
      this.options = options;
    }.bind(this);

    this.filter = {};
    this.torqueLayerModel = new TorqueLayerModel();
    this.view = new TimeContentView({
      model: this.model,
      torqueLayerModel: this.torqueLayerModel,
      filter: this.filter
    });
    this.renderResult = this.view.render();
  });

  it('should render loading state', function() {
    expect(this.renderResult).toBe(this.view);
  });

  describe('when data is provided', function() {
    beforeEach(function() {
      var timeOffset = 10000;
      var startTime = (new Date()).getTime() - timeOffset;
      this.model.fetch();
      this.options.success({
        bins: [{
          start: startTime,
          end: startTime + timeOffset,
          freq: 3
        }]
      });
    });

    it('should render a time marker', function() {
      expect(this.view.$('.TimeMarker').length).toEqual(1);
    });
  });
});
