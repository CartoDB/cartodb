var _ = require('underscore');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/torque-layer', function () {
  sharedTestsForInteractiveLayers(TorqueLayer);

  describe('map reloading', function () {
    var ATTRIBUTES = ['visible', 'sql', 'source'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the map when '" + attribute + "' attribute changes", function () {
        var map = jasmine.createSpyObj('map', ['reload']);
        var layer = new TorqueLayer({}, { map: map });

        layer.set(attribute, 'new_value');

        expect(map.reload).toHaveBeenCalled();
      });
    });

    it('should reload the map just once when multiple attributes change', function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new TorqueLayer({}, { map: map });

      var newAttributes = {};
      _.each(ATTRIBUTES, function (attr, index) {
        newAttributes[attr] = 'new_value_' + index;
      });
      layer.set(newAttributes);

      expect(map.reload).toHaveBeenCalled();
      expect(map.reload.calls.count()).toEqual(1);
    });

    it('should NOT reload the map when cartocss is set and it was previously empty', function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new TorqueLayer({}, { map: map });

      layer.set('cartocss', 'new_value');

      expect(map.reload).not.toHaveBeenCalled();
    });

    it("should NOT reload the map if cartocss attribute has changed but torque-time-attribute property hasn't changed", function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new TorqueLayer({
        cartocss: 'layer { something: "a", -torque-time-attribute: "column" }'
      }, { map: map });

      layer.set('cartocss', 'layer { something: "b", -torque-time-attribute: "column" }');

      expect(map.reload).not.toHaveBeenCalled();
    });

    it('should reload the map if cartocss attribute has changed and torque-time-attribute property has changed', function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var layer = new TorqueLayer({
        cartocss: 'layer { something: "a", -torque-time-attribute: "columnA" }'
      }, { map: map });

      layer.set('cartocss', 'layer { something: "b", -torque-time-attribute: "columnB" }');

      expect(map.reload).toHaveBeenCalled();
    });
  });
});
