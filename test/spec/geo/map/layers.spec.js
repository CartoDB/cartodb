var Layers = require('../../../../src/geo/map/layers');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');

describe('geo/map/layers', function () {
  var layers;

  beforeEach(function () {
    layers = new Layers();
  });

  it('should compare equal layers correctly', function () {
    var layer1 = new PlainLayer({ name: 'Positron' });
    var layer2 = new PlainLayer({});
    var layer3 = new PlainLayer({});
    var layer4 = new PlainLayer({});

    expect(layer3.isEqual(layer4)).toBeTruthy();
    expect(layer1.isEqual(layer2)).not.toBeTruthy();

    layers.add(layer4);
    layers.add(layer3);

    expect(layer3.isEqual(layer4)).toBeTruthy();
  });

  it('should compare TileLayers', function () {
    var layer1 = new TileLayer({ urlTemplate: 'urlTemplate', name: 'layer1', other: 'something' });
    var layer2 = new TileLayer({ urlTemplate: 'urlTemplate', name: 'layer2', other: 'else' });

    expect(layer1.isEqual(layer2)).toBeFalsy();

    layer2.set({ name: 'layer1' }, { silent: true });

    expect(layer1.isEqual(layer2)).toBeTruthy();
  });

  it('should re-assign order when new layers are added to the collection', function () {
    var baseLayer = new TileLayer();
    var layer1 = new CartoDBLayer();
    var layer2 = new CartoDBLayer();
    var layer3 = new CartoDBLayer();

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

    var torqueLayer = new TorqueLayer({});

    // Torque layer should be at the top
    layers.add(torqueLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(torqueLayer.get('order')).toEqual(4);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4 ]);

    var tiledLayer = new TileLayer({});

    // Tiled layer should be at the top
    layers.add(tiledLayer);

    expect(baseLayer.get('order')).toEqual(0);
    expect(layer1.get('order')).toEqual(2);
    expect(layer2.get('order')).toEqual(3);
    expect(layer3.get('order')).toEqual(1);
    expect(torqueLayer.get('order')).toEqual(4);
    expect(tiledLayer.get('order')).toEqual(5);
    expect(layers.pluck('order')).toEqual([ 0, 1, 2, 3, 4, 5 ]);

    var layer4 = new CartoDBLayer({});
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
    var baseLayer = new TileLayer();
    var layer1 = new CartoDBLayer();
    var layer2 = new CartoDBLayer();
    var torqueLayer = new TorqueLayer({});
    var labelsLayer = new TileLayer();

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
});
