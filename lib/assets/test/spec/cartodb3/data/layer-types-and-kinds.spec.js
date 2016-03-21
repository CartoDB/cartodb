var layerTypesAndKinds = require('../../../../javascripts/cartodb3/data/layer-types-and-kinds');

describe('data/layer-types-and-kinds', function () {
  describe('.getKind', function () {
    it('should return the kind for a given type', function () {
      expect(layerTypesAndKinds.getKind('Tiled')).toEqual('tiled');
      expect(layerTypesAndKinds.getKind('CartoDB')).toEqual('carto');
      expect(layerTypesAndKinds.getKind('WMS')).toEqual('wms');
      expect(layerTypesAndKinds.getKind('Plain')).toEqual('background');
      expect(layerTypesAndKinds.getKind('GMapsBase')).toEqual('gmapsbase');
      expect(layerTypesAndKinds.getKind('torque')).toEqual('torque');
    });
  });

  describe('.getType', function () {
    it('should return the type for a given kind', function () {
      expect(layerTypesAndKinds.getType('tiled')).toEqual('Tiled');
      expect(layerTypesAndKinds.getType('carto')).toEqual('CartoDB');
      expect(layerTypesAndKinds.getType('wms')).toEqual('WMS');
      expect(layerTypesAndKinds.getType('background')).toEqual('Plain');
      expect(layerTypesAndKinds.getType('gmapsbase')).toEqual('GMapsBase');
      expect(layerTypesAndKinds.getType('torque')).toEqual('torque');

      expect(layerTypesAndKinds.getType('Layer::Tiled')).toEqual('Tiled');
      expect(layerTypesAndKinds.getType('Layer::Carto')).toEqual('CartoDB');
      expect(layerTypesAndKinds.getType('Layer::Background')).toEqual('Plain');
    });
  });
});
