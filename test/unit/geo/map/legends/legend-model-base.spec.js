var Backbone = require('backbone');
var LegendModelBase = require('../../../../../src/geo/map/legends/legend-model-base');

var MyLegendModel = LegendModelBase.extend({
  TYPE: 'type'
});

describe('src/geo/map/legends/legend-model-base', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();

    this.legendModel = new MyLegendModel({}, {
      visModel: this.visModel
    });
  });

  it('should have a "loading" state', function () {
    expect(this.legendModel.isLoading()).toBeTruthy();
  });

  it('should change state to "loading" when vis is reloading', function () {
    this.legendModel.set('state', 'something');
    expect(this.legendModel.isLoading()).toBeFalsy();

    this.visModel.trigger('reload');

    expect(this.legendModel.isLoading()).toBeTruthy();
  });
});
