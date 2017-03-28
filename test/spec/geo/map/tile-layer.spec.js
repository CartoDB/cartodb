var TileLayer = require('../../../../src/geo/map/tile-layer');

describe('TileLayer', function () {
  beforeEach(function () {
    this.vis = jasmine.createSpyObj('vis', [ 'reload' ]);
  });

  it('should be type tiled', function () {
    var layer = new TileLayer(null, { vis: this.vis });
    expect(layer.get('type')).toEqual('Tiled');
  });

  describe('vis reloading', function () {
    it("should reload the vis when 'urlTemplate' attribute changes", function () {
      var layer = new TileLayer({}, { vis: this.vis });

      layer.set('urlTemplate', 'new_value');

      expect(this.vis.reload).toHaveBeenCalled();
    });
  });
});
