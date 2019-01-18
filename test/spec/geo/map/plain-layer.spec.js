var _ = require('underscore');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var createEngine = require('../../fixtures/engine.fixture.js');

describe('PlainLayer', function () {
  var engineMock;
  beforeEach(function () {
    engineMock = createEngine();
  });

  it('should be type plain', function () {
    var layer = new PlainLayer(null, { engine: engineMock });
    expect(layer.get('type')).toEqual('Plain');
  });

  describe('vis reloading', function () {
    var ATTRIBUTES = ['color', 'image'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new PlainLayer(null, { engine: engineMock });

        layer.set(attribute, 'new_value');

        expect(engineMock.reload).toHaveBeenCalled();
      });
    });
  });
});
