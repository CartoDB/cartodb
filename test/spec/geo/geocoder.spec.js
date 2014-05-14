
// Yahoo geocoder

describe('Geocoder', function() {

  // commented because we don't have a valid api key
  xit('we should get a direction that exists using YAHOO', function() {
    var data;
    runs(function() {
      cdb.geo.geocoder.YAHOO.geocode('Madrid, Spain', function(d) {
        data = d;
      })
    });
    waits(1000);
    runs(function() {
      expect(data.length).toEqual(0);
      expect(data[0].lat).toEqual('40.4203');
      expect(data[0].lon).toEqual('-3.70577');
      expect(data[0].boundingbox).toBeTruthy();
    });
  });

  it('we should don\'t get a direction that doesn\'t exist using YAHOO', function() {
    var data;
    runs(function() {
      cdb.geo.geocoder.YAHOO.geocode('Wadusworld', function(d) {
        data = d;
      });
    });
    waits(1000);
    runs(function() {
        expect(data.length).toEqual(0);
    });
  });

  it('we should get a direction that exists using NOKIA', function() {
    var data;
    runs(function() {
      cdb.geo.geocoder.NOKIA.geocode('Madrid, Spain', function(d) {
        data = d;
      });
    });
    waits(2000);
    runs(function() {
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
      expect(data[0].boundingbox).toBeTruthy();
    });
  });

  it('we should get a direction with # character using NOKIA', function() {
    var data;
    runs(function() {
      cdb.geo.geocoder.NOKIA.geocode('# Mexico', function(d) {
        data = d;
      });
    });
    waits(1000);
    runs(function() {
      expect(data.length).not.toEqual(0);
      expect(data[0].lat).not.toEqual(undefined);
      expect(data[0].lon).not.toEqual(undefined);
    });
  });

  it('we should don\'t get a direction that doesn\'t exist using NOKIA', function() {
    var data;
    runs(function() {
      cdb.geo.geocoder.NOKIA.geocode('InternationalWadusworldIncorporated', function(d) {
        data = d;
      });
    });
    waits(1000);
    runs(function() {
      expect(data.length).toEqual(0);
    });
  });
});
