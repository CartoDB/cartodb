var _ = require('underscore');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/torque-layer', function () {
  beforeEach(function () {
    this.vis = jasmine.createSpyObj('vis', ['reload']);
  });

  sharedTestsForInteractiveLayers(TorqueLayer);

  describe('vis reloading', function () {
    var ATTRIBUTES = ['sql', 'sql_wrap', 'source'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new TorqueLayer({}, { vis: this.vis });

        layer.set(attribute, 'new_value');

        expect(this.vis.reload).toHaveBeenCalled();
      });
    });

    it('should reload the map just once when multiple attributes change', function () {
      var layer = new TorqueLayer({}, { vis: this.vis });

      var newAttributes = {};
      _.each(ATTRIBUTES, function (attr, index) {
        newAttributes[attr] = 'new_value_' + index;
      });
      layer.set(newAttributes);

      expect(this.vis.reload).toHaveBeenCalled();
      expect(this.vis.reload.calls.count()).toEqual(1);
    });

    it('should NOT reload the map when cartocss is set and it was previously empty', function () {
      var layer = new TorqueLayer({}, { vis: this.vis });

      layer.set('cartocss', 'new_value');

      expect(this.vis.reload).not.toHaveBeenCalled();
    });

    it('should NOT reload the map if cartocss property has changed and a reload is not needed', function () {
      var layer = new TorqueLayer({
        cartocss: 'Map { something: "a"; -torque-time-attribute: "column"; }'
      }, { vis: this.vis });

      layer.set('cartocss', 'Map { something: "b"; -torque-time-attribute: "column"; }');

      expect(this.vis.reload).not.toHaveBeenCalled();
    });

    it('should reload the map if cartocss property has changed and it has a ramp', function () {
      var layer = new TorqueLayer({
        cartocss: 'Map { -torque-time-attribute: "cartodb_id"; } #layer { marker-fill: ramp([value], (#5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040), (1, 2, 3, 4, 5, 6, 7, 8), "="); }'
      }, { vis: this.vis });

      layer.set('cartocss', 'Map { -torque-time-attribute: "cartodb_id"; } #layer { marker-fill: ramp([value], (#5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040), (1, 2, 3, 4, 5, 6, 7, 8), "="); comp-op: lighter; }');

      expect(this.vis.reload).toHaveBeenCalled();
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
        }, { vis: this.vis });

        layer.set('cartocss', 'Map { something: "b"; ' + property + ': "valueB"; }');

        expect(this.vis.reload).toHaveBeenCalled();
      });
    });
  });
});
