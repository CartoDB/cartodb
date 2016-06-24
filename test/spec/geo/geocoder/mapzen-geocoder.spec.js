var MAPZEN = require('../../../../src/geo/geocoder/mapzen-geocoder');

describe('geo/geocoder/mapzen-geocoder', function () {
  it("don't remove the spaces in the user-submitted addresses [MAPZEN]", function (done) {
    var regexp = new RegExp(/http:\/\/search.mapzen.com\/v1\/search\?text\=bn20%208qt/);
    MAPZEN.geocode('bn20 8qt', function (d) {
      expect(this.url).toMatch(regexp);
      done();
    });
  });

  it('we should get a direction that exists using MAPZEN', function (done) {
    var data;
    MAPZEN.geocode('Madrid, Spain', function (d) {
      data = d;
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
      // expect(data[0].boundingbox).toBeTruthy();
      done();
    });
  });

  it('we should get a direction with # character using MAPZEN', function (done) {
    var data;
    MAPZEN.geocode('# Mexico', function (d) {
      data = d;
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
      done();
    });
  });

  it("we shouldn't get a direction that doesn't exist using MAPZEN", function (done) {
    var data;
    MAPZEN.geocode('****', function (d) {
      data = d;
      expect(data.length).toEqual(0);
      done();
    });
  });
});
