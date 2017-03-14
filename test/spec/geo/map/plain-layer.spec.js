var _ = require('underscore');
var PlainLayer = require('../../../../src/geo/map/plain-layer');

describe('PlainLayer', function () {
  beforeEach(function () {
    this.vis = jasmine.createSpyObj('vis', [ 'reload' ]);
  });

  it('should be type plain', function () {
    var layer = new PlainLayer(null, { vis: this.vis });
    expect(layer.get('type')).toEqual('Plain');
  });

  describe('vis reloading', function () {
    var ATTRIBUTES = ['color', 'image'];

    _.each(ATTRIBUTES, function (attribute) {
      it("should reload the vis when '" + attribute + "' attribute changes", function () {
        var layer = new PlainLayer({}, { vis: this.vis });

        layer.set(attribute, 'new_value');

        expect(this.vis.reload).toHaveBeenCalled();
      });
    });
  });
});
