var Backbone = require('backbone');
var TimeSeriesWidgetModel = require('../../../src/widgets/time-series/time-series-widget-model');

describe('widgets/time-series/time-series-widget-model', function () {
  beforeEach(function () {
    this.model = new TimeSeriesWidgetModel(null, {
      dataviewModel: new Backbone.Model()
    });
  });

  it('should set normalized default and default state', function () {
    expect(this.model.get('normalized')).toBe(true);
    expect(this.model.getState().normalized).toBeDefined();
    expect(this.model.getState().normalized).toBe(true);
  });
});
