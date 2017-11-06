var carto = require('../../../../src/api/v4');

describe('client', function () {
  describe('constructor', function () {
    it('should build a new client', function () {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        serverUrl: 'https://{user}.carto.com:443',
        username: 'cartojs-test'
      });
      expect(client).toBeDefined();
      expect(client.getLayers()).toEqual([]);
    });
  });

  describe('.addLayer', function () {
    it('should add a new layer', function () {});
    it('should add a new layer triggering a reload cycle by default', function () {});
    it('should add a new layer without triggering a reload cycle when opts.reload is false', function () {});
    it('should return a rejected promise when some error happened', function () {});
  });

  describe('.addLayers', function () {
    it('should add a layers array', function () {});
    it('should add a layer array triggering a reload cycle by default', function () {});
    it('should add a layers array without triggering a reload cycle when opts.reload is false', function () {});
    it('should return a rejected promise when some error happened', function () {});
  });

  describe('.getLayers', function () {
    it('should return an empty array when there are no layers', function () {});
    it('should return the layers stored in the client', function () {});
  });

  describe('.removeLayer', function () {
    it('should throw a descriptive error when the parameter is invalid', function () {});
    it('should throw a descriptive error when layer is not in the client', function () {});
    it('should remove the layer when is in the client', function () {});
  });
});
