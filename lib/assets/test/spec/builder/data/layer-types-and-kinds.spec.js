var _ = require('underscore');
var layerTypesAndKinds = require('builder/data/layer-types-and-kinds');

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

    it('should throw exception when type is unknown', function () {
      expect(function () {
        layerTypesAndKinds.getKind(null);
      }).toThrow();
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
    });

    it('should throw exception when kind is unknown', function () {
      expect(function () {
        layerTypesAndKinds.getType(null);
      }).toThrow();
    });
  });

  describe('.isKindDataLayer', function () {
    it('should return true if matching', function () {
      expect(layerTypesAndKinds.isKindDataLayer('carto')).toBe(true);
      expect(layerTypesAndKinds.isKindDataLayer('torque')).toBe(true);

      expect(layerTypesAndKinds.isKindDataLayer('tiled')).toBe(false);
      expect(layerTypesAndKinds.isKindDataLayer('cartooo')).toBe(false);
    });
  });

  _.each({
    'isCartoDBType': 'CartoDB',
    'isTiledType': 'Tiled',
    'isTorqueType': 'torque',
    'isPlainType': 'Plain'
  }, function (type, method) {
    describe('.' + method, function () {
      it('should return true if type is "' + type + '"', function () {
        expect(layerTypesAndKinds[method](type)).toBe(true);
      });

      it('should return false when given a different type', function () {
        expect(layerTypesAndKinds[method]('invalid type')).toBe(false);
      });
    });
  });
});
