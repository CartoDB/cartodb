var _ = require('underscore');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');
var createEngine = require('../../fixtures/engine.fixture.js');

describe('geo/map/torque-layer', function () {
  var engineMock;
  beforeEach(function () {
    engineMock = createEngine();
  });

  sharedTestsForInteractiveLayers(TorqueLayer);

  describe('vis reloading', function () {
    var ATTRIBUTES = ['sql', 'sql_wrap', 'source'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new TorqueLayer({}, { engine: engineMock });

        layer.set(attribute, 'new_value');

        expect(engineMock.reload).toHaveBeenCalled();
      });
    });

    it('should reload the map just once when multiple attributes change', function () {
      var layer = new TorqueLayer({}, { engine: engineMock });

      var newAttributes = {};
      _.each(ATTRIBUTES, function (attr, index) {
        newAttributes[attr] = 'new_value_' + index;
      });
      layer.set(newAttributes);

      expect(engineMock.reload).toHaveBeenCalled();
      expect(engineMock.reload.calls.count()).toEqual(1);
    });

    it('should NOT reload the map when cartocss is set and it was previously empty', function () {
      var layer = new TorqueLayer({}, { engine: engineMock });

      layer.set('cartocss', 'new_value');

      expect(engineMock.reload).not.toHaveBeenCalled();
    });

    it('should NOT reload the map if cartocss property has changed and a reload is not needed', function () {
      var layer = new TorqueLayer({
        cartocss: 'Map { something: "a"; -torque-time-attribute: "column"; }'
      }, { engine: engineMock });

      layer.set('cartocss', 'Map { something: "b"; -torque-time-attribute: "column"; }');

      expect(engineMock.reload).not.toHaveBeenCalled();
    });

    _.each([
      '-torque-frame-count',
      '-torque-time-attribute',
      '-torque-aggregation-function',
      '-torque-data-aggregation',
      '-torque-resolution'
    ], function (property) {
      it('should reload the map if cartocss attribute has changed and "' + property + '"" property has changed', function () {
        var layer = new TorqueLayer({
          cartocss: 'Map { something: "a"; ' + property + ': "valueA"; }'
        }, { engine: engineMock });

        layer.set('cartocss', 'Map { something: "b"; ' + property + ': "valueB"; }');

        expect(engineMock.reload).toHaveBeenCalled();
      });
    });
  });

  describe('.getAnimationDuration', function () {
    var layer;

    beforeEach(function () {
      layer = new TorqueLayer({}, { engine: engineMock });
    });

    it('should take the animation duration if it is defined', function () {
      var cartocss = 'Map { -torque-animation-duration: 22; }';
      expect(layer.getAnimationDuration(cartocss)).toBe(22);

      cartocss = 'Map { -torque-animation-duration:15; }';
      expect(layer.getAnimationDuration(cartocss)).toBe(15);
    });

    it('should take the defualt animation duration if the attribute isn\'t defined', function () {
      var cartocss = 'Map { -torque-animation-aggregation: cartodb_id; }';
      expect(layer.getAnimationDuration(cartocss)).toBe(30);

      cartocss = 'Map { something: "a"; -torque-time-attribute: "column"; }';
      expect(layer.getAnimationDuration(cartocss)).toBe(30);
    });
  });
});
