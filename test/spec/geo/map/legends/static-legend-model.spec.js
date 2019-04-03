var StaticLegendModelBase = require('../../../../../src/geo/map/legends/static-legend-model-base');
var createEngine = require('../../../fixtures/engine.fixture.js');
var Engine = require('../../../../../src/engine');
var MyLegendModel = StaticLegendModelBase.extend({ TYPE: 'type' });

describe('src/geo/map/legends/static-legend-model-base', function () {
  var engineMock;
  var legendModel;
  beforeEach(function () {
    engineMock = createEngine();
    legendModel = new MyLegendModel({}, { engine: engineMock });
  });

  it('should never change state to "loading" when vis is reloading', function () {
    legendModel.set('state', 'something');
    expect(legendModel.isLoading()).toBeFalsy();
    engineMock._eventEmmitter.trigger(Engine.Events.RELOAD_STARTED);
    expect(legendModel.isLoading()).toBeFalsy();
  });
});
