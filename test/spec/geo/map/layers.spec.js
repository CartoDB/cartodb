var VisModel = require('../../../../src/vis/vis');
var Layers = require('../../../../src/geo/map/layers');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');

describe('geo/map/layers', function () {
  var layers;

  beforeEach(function () {
    this.vis = new VisModel();
    layers = new Layers();
  });

  it('should re-assign order when new layers are added to the collection', function () {
    var baseLayer = new TileLayer(null, { vis: {} });
    var layer1 = new CartoDBLayer({}, { vis: this.vis });
    var layer2 = new CartoDBLayer({}, { vis: this.vis });
    var layer3 = new CartoDBLayer({}, { vis: this.vis });

    // Sets the order to 0
    layers.add(baseLayer);

    expect(baseLayer.get('order')).toEqual(0);

    // Sets the order to 1
    layers.add(layer1);
    layers.add(layer2);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(1);
    expect(layer2.get('order')).toEqual(2);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2 ]);

    // Sets the order to 1 and re-orders the rest of the layers
    layers.add(layer3, { at: 1 });

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3 ]);

    var torqueLayer = new TorqueLayer({}, { vis: this.vis });

    // Torque layer should be at the top
    layers.add(torqueLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(torqueLayer.get('order')).toEqual(4);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4 ]);

    var tiledLayer = new TileLayer(null, { vis: {} });

    // Tiled layer should be at the top
    layers.add(tiledLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(torqueLayer.get('order')).toEqual(4);
    expect(tiledLayer.get('order')).toEqual(5);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4, 5 ]);

    var layer4 = new CartoDBLayer({}, { vis: this.vis });
    layers.add(layer4);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(layer4.get('order')).toEqual(4);
    expect(torqueLayer.get('order')).toEqual(5);
    expect(tiledLayer.get('order')).toEqual(6);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4, 5, 6 ]);
  });

  it('should re-assign order when new layers are removed from the collection', function () {
    var baseLayer = new TileLayer(null, { vis: {} });
    var layer1 = new CartoDBLayer({}, { vis: this.vis });
    var layer2 = new CartoDBLayer({}, { vis: this.vis });
    var torqueLayer = new TorqueLayer({}, { vis: this.vis });
    var labelsLayer = new TileLayer(null, { vis: {} });

    // Sets the order to 0
    layers.add(baseLayer);
    layers.add(layer1);
    layers.add(layer2);
    layers.add(torqueLayer);
    layers.add(labelsLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(1);
    expect(layer2.get('order')).toEqual(2);
    expect(torqueLayer.get('order')).toEqual(3);
    expect(labelsLayer.get('order')).toEqual(4);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4 ]);

    layers.remove(layer1);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer2.get('order')).toEqual(1);
    expect(torqueLayer.get('order')).toEqual(2);
    expect(labelsLayer.get('order')).toEqual(3);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3 ]);

    layers.remove(torqueLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer2.get('order')).toEqual(1);
    expect(labelsLayer.get('order')).toEqual(2);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2 ]);

    layers.remove(labelsLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer2.get('order')).toEqual(1);
    expect(layers.pluck('order')).toEqual([ 0, 1 ]);
  });

  describe('.moveCartoDBLayer', function () {
    beforeEach(function () {
      layers.add(new PlainLayer({ name: 'Positron' }, { vis: {} }));
      layers.add(new CartoDBLayer({ title: 'CARTO' }, { vis: this.vis }));
    });

    it('should move a layer from one position to other', function () {
      var movedLayer = layers.moveCartoDBLayer(1, 0);
      expect(layers.indexOf(movedLayer)).toBe(0);
      expect(movedLayer.get('title')).toBe('CARTO');

      layers.add(new CartoDBLayer({ title: 'CARTO 2' }, { vis: this.vis }));
      movedLayer = layers.moveCartoDBLayer(2, 1);
      expect(layers.indexOf(movedLayer)).toBe(1);
      expect(movedLayer.get('title')).toBe('CARTO 2');
    });

    it('should not move anything if the position is the same', function () {
      var movedLayer = layers.moveCartoDBLayer(1, 1);
      expect(movedLayer).toBeFalsy();
      expect(layers.at(1).get('title')).toBe('CARTO');
    });

    it('should not move the layer if it is not a CartoDB type', function () {
      var movedLayer = layers.moveCartoDBLayer(0, 1);
      expect(movedLayer).toBeFalsy();
      expect(layers.at(1).get('title')).toBe('CARTO');
    });
  });
});
