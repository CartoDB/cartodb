var MapProperties = require('../../../../../src-browserify/geo/layer-definition/map-properties');

describe('geo/layer-definition/map-properties', function() {

  describe('.getMapId', function() {

    it('returns the id of the map', function() {
      var mapProperties = new MapProperties( { layergroupid: 'wadus' });
      expect(mapProperties.getMapId()).toEqual('wadus');
    })
  });

  describe('.getLayerIndexByType', function() {

    it('returns the index of a layer of a given type', function() {
      var layers = [
        { type: 'mapnik' },
        { type: 'http' },
        { type: 'mapnik' }
      ]
      var mapProperties = new MapProperties({
        metadata: {
          layers: layers
        }
      });
      expect(mapProperties.getLayerIndexByType(0, 'mapnik')).toEqual(0);
      expect(mapProperties.getLayerIndexByType(1, 'mapnik')).toEqual(2);
      expect(mapProperties.getLayerIndexByType(0, 'http')).toEqual(1);
      expect(mapProperties.getLayerIndexByType(10, 'http')).toEqual(-1);
    })

    it('returns the given index if metadata is empty', function() {
      var mapProperties = new MapProperties({});

      expect(mapProperties.getLayerIndexByType(0, 'mapnik')).toEqual(0);
      expect(mapProperties.getLayerIndexByType(1, 'mapnik')).toEqual(1);
    })
  })

  describe('.getLayerIndexesByType', function() {
    var mapProperties;

    beforeEach(function() {
      var layers = [
        { type: 'mapnik' },
        { type: 'http' },
        { type: 'torque' },
        { type: 'mapnik' }
      ]
      mapProperties = new MapProperties({
        metadata: {
          layers: layers
        }
      });
    })

    it('should return the indexes of all non-torque layers if no types are specified', function() {
      expect(mapProperties.getLayerIndexesByType()).toEqual([0, 1, 3]);
      expect(mapProperties.getLayerIndexesByType('')).toEqual([0, 1, 3]);
      expect(mapProperties.getLayerIndexesByType([])).toEqual([0, 1, 3]);
    })

    it('should return the indexes of the layers of the given types', function() {
      expect(mapProperties.getLayerIndexesByType('mapnik')).toEqual([0, 3]);
      expect(mapProperties.getLayerIndexesByType('http')).toEqual([1]);
      expect(mapProperties.getLayerIndexesByType(['http', 'mapnik'])).toEqual([0, 1, 3]);
    })

    it('returns wadus if metadata is empty', function() {
      mapProperties = new MapProperties({ });
      expect(mapProperties.getLayerIndexesByType()).toBeUndefined();
    })
  })
})
