
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

describe('Geocoder', function() {
  describe('NOKIA', function() {
    it("don't remove the spaces in the user-submitted addresses [NOKIA]", function(done) {
      var regexp = new RegExp(/http:\/\/places.nlp.nokia.com\/places\/v1\/discover\/search\/\?q\=bn20%208qt/);

      cdb.geo.geocoder.NOKIA.geocode('bn20 8qt', function(d) {
        expect(this.url).toMatch(regexp);
        done();
      });
    });

    it("we should get a direction that exists using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('Madrid, Spain', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        expect(data[0].boundingbox).toBeTruthy();
        done();
      });
    });

    it("we should get a direction with # character using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('# Mexico', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        done();
      });
    });

    it("we shouldn't get a direction that doesn't exist using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('68461092610314965639', function(d) {
        data = d;
        expect(data.length).toEqual(0);
        done();
      });
    });
  });

  describe('MAPZEN', function () {
    beforeEach(function () {
      this.jqxhr = $.Deferred();
      spyOn($, 'ajax').and.returnValue(this.jqxhr);
    });

    it('should trigger a request to the service', function () {
      cdb.geo.geocoder.MAPZEN.geocode('Madrid', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=madrid&api_key=' + cdb.geo.geocoder.MAPZEN.keys.app_id);
    });

    it('should remove accents from address', function () {
      cdb.geo.geocoder.MAPZEN.geocode('áéíóú', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=aeiou&api_key=' + cdb.geo.geocoder.MAPZEN.keys.app_id);
    });

    it('should lowercase the address', function () {
      cdb.geo.geocoder.MAPZEN.geocode('AEIOU', function () {});
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://search.mapzen.com/v1/search?text=aeiou&api_key=' + cdb.geo.geocoder.MAPZEN.keys.app_id);
    });

    describe('when geocoding succeeds', function () {
      beforeEach(function () {
        this.callback = jasmine.createSpy('callback');
        cdb.geo.geocoder.MAPZEN.geocode('Madrid', this.callback);
        $.ajax.calls.mostRecent().args[0].success(mapzenResponse);
      });

      it('should invoke the given callback', function () {
        expect(this.callback).toHaveBeenCalledWith([
          { lat: 40.429913, lon: -3.669245, type: 'locality', title: 'Madrid, Spain' }
        ]);
      });
    });
  });

  describe('YAHOO', function() {
    it("we shouldn't get a direction that doesn't exist using YAHOO", function(done) {
      var data;
      cdb.geo.geocoder.YAHOO.geocode('Wadusworld', function(d) {
        data = d;
        expect(data.length).toEqual(0);
        done();
      });
    });
  });
});
