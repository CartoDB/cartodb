var $ = require('jquery');
var config = require('../../../../src/cdb.config');
var MAPZEN = require('../../../../src/geo/geocoder/mapzen-geocoder');
var log = require('cdb.log');

var mapzenResponse = {
  'geocoding': {},
  'type': 'FeatureCollection',
  'features': [
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [
          -3.669245,
          40.429913
        ]
      },
      'properties': {
        'id': '101748283',
        'gid': 'whosonfirst:locality:101748283',
        'layer': 'locality',
        'source': 'whosonfirst',
        'source_id': '101748283',
        'name': 'Madrid',
        'confidence': 0.951,
        'accuracy': 'centroid',
        'country': 'Spain',
        'country_gid': 'whosonfirst:country:85633129',
        'country_a': 'ESP',
        'macroregion': 'Comunidad De Madrid',
        'macroregion_gid': 'whosonfirst:macroregion:404227387',
        'region': 'Madrid',
        'region_gid': 'whosonfirst:region:85682783',
        'localadmin': 'Madrid',
        'localadmin_gid': 'whosonfirst:localadmin:404338863',
        'locality': 'Madrid',
        'locality_gid': 'whosonfirst:locality:101748283',
        'label': 'Madrid, Spain'
      },
      'bbox': [
        -3.83213999304,
        40.3120207163,
        -3.53212,
        40.5334948396
      ]
    }
  ],
  'bbox': [
    -103.878731891,
    4.73245,
    125.93368,
    44.847083
  ]
};

describe('geo/geocoder/mapzen-geocoder', function () {
  beforeEach(function () {
    this.jqxhr = $.Deferred();
    spyOn($, 'ajax').and.returnValue(this.jqxhr);
  });

  describe('if a Mapzen API Key has been set up', function () {
    beforeEach(function () {
      config.set('mapzenApiKey', 'MAPZEN_API_KEY');
    });

    it('should trigger a request to the service', function () {
      MAPZEN.geocode('Madrid', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=madrid&api_key=MAPZEN_API_KEY');
    });

    it('should remove accents from address', function () {
      MAPZEN.geocode('áéíóú', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=aeiou&api_key=MAPZEN_API_KEY');
    });

    it('should lowercase the address', function () {
      MAPZEN.geocode('AEIOU', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=aeiou&api_key=MAPZEN_API_KEY');
    });

    describe('when geocoding succeeds', function () {
      beforeEach(function () {
        this.callback = jasmine.createSpy('callback');
        MAPZEN.geocode('Madrid', this.callback);
        this.jqxhr.resolve(mapzenResponse);
      });

      it('should invoke the given callback', function () {
        expect(this.callback).toHaveBeenCalledWith([
          { lat: 40.429913, lon: -3.669245, type: 'locality', title: 'Madrid, Spain' }
        ]);
      });
    });

    describe('when geocoding fails', function () {
      beforeEach(function () {
        spyOn(log, 'error');
        this.callback = jasmine.createSpy('callback');
        MAPZEN.geocode('Madrid', this.callback);
        this.jqxhr.reject(this.jqxhr, 'error');
      });

      it('should not invoke the given callback', function () {
        expect(this.callback).not.toHaveBeenCalled();
      });

      it('should log an error', function () {
        expect(log.error).toHaveBeenCalledWith('[Mapzen Geocoder] error: error');
      });
    });
  });

  describe('if a Mapzen API Key has NOT been set up', function () {
    beforeEach(function () {
      spyOn(log, 'error');
      this.callback = jasmine.createSpy('callback');

      config.unset('mapzenApiKey');

      MAPZEN.geocode('Madrid', this.callback);
    });

    it('should log an error', function () {
      expect(log.error).toHaveBeenCalledWith('[Mapzen Geocoder] API Key is missing');
    });
  });
});
