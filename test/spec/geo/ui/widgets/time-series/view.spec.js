var HistogramModel = require('cdb/geo/ui/widgets/histogram/model');
var TimeSeriesWidgetView = require('cdb/geo/ui/widgets/time-series/view');

describe('geo/ui/widgets/time-series/view', function() {
  beforeEach(function() {
    this.model = new HistogramModel({
    });
    this.model.sync = function(method, model, options) {
      this.options = options;
    }.bind(this);
    this.view = new TimeSeriesWidgetView({
      model: this.model
    });
    this.view.render();
  });

  it('should render', function() {
    expect(this.view.$el.html()).not.toEqual('');
  });

  it('should not render chart just yet since have no data', function() {
    expect(this.view.$el.html()).not.toContain('<svg');
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

    it('should render chart', function() {
      expect(this.view.$el.html()).toContain('<svg');
    });
  });
});
