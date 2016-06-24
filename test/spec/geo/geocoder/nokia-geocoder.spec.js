var $ = require('jquery');
var NOKIA = require('../../../../src/geo/geocoder/nokia-geocoder');

describe('geo/geocoder/nokia-geocoder', function() {
  it("don't remove the spaces in the user-submitted addresses", function(done) {
    var regexp = new RegExp(/http:\/\/places.nlp.nokia.com\/places\/v1\/discover\/search\/\?q\=bn20%208qt/);

    NOKIA.geocode('bn20 8qt', function(d) {
      expect(this.url).toMatch(regexp);
      done();
    });
  });

  it("we should get a direction that exists", function(done) {
    var data;
    NOKIA.geocode('Madrid, Spain', function(d) {
      data = d;
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
      expect(data[0].boundingbox).toBeTruthy();
      done();
    });
  });

  it("we should get a direction with # character", function(done) {
    var data;
    NOKIA.geocode('# Mexico', function(d) {
      data = d;
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
      done();
    });
  });

  it("we shouldn't get a direction that doesn't exist", function(done) {
    var data;
    NOKIA.geocode('68461092610314965639', function(d) {
      data = d;
      expect(data.length).toEqual(0);
      done();
    });
  });
});
