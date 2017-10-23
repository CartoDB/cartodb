var TileLayer = require('../../../../src/geo/map/tile-layer');
var Engine = require('../../../../src/engine');

fdescribe('TileLayer', function () {
  var engineMock;
  var layer;
  beforeEach(function () {
    engineMock = new Engine({ serverUrl: 'http://example.com', username: 'fake-username' });
    spyOn(engineMock, 'reload');
    layer = new TileLayer(null, { engine: engineMock });
  });

  it('should be type tiled', function () {
    expect(layer.get('type')).toEqual('Tiled');
  });

  describe('vis reloading', function () {
    it("should reload the vis when 'urlTemplate' attribute changes", function () {
      layer.set('urlTemplate', 'new_value');
      expect(engineMock.reload).toHaveBeenCalled();
    });
  });
});
