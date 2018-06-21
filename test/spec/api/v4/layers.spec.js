var Layers = require('../../../../src/api/v4/layers');

describe('api/v4/layers', function () {
  var layers;

  function createFakeLayer (id) {
    return {
      getId: function () {
        return id;
      }
    };
  }

  function seedLayers (layers) {
    var layerA = createFakeLayer('A');
    var layerB = createFakeLayer('B');
    var layerC = createFakeLayer('C');

    layers.add(layerA);
    layers.add(layerB);
    layers.add(layerC);

    return [layerA, layerB, layerC];
  }

  beforeEach(function () {
    layers = new Layers();
  });

  describe('.remove', function () {
    it('should remove the layer from the collection', function () {
      var createdLayers = seedLayers(layers);

      layers.remove(createdLayers[1]);

      expect(layers.size()).toBe(2);
      expect(layers.indexOf(createdLayers[0])).toBe(0);
      expect(layers.indexOf(createdLayers[2])).toBe(1);
    });
  });
});
