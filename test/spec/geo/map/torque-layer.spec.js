var _ = require('underscore');
var Backbone = require('backbone');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var sharedTestsForInteractiveLayers = require('./shared-for-interactive-layers');

describe('geo/map/torque-layer', function () {
  beforeEach(function () {
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');
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

  describe('.getAnimationDuration', function () {
    var layer;

    beforeEach(function () {
      layer = new TorqueLayer({}, { vis: this.vis });
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
