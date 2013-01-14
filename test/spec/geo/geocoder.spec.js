
// Yahoo geocoder

describe('Geocoder', function() {

  it('we should get a direction that exists using YAHOO', function() {
    cdb.geo.geocoder.YAHOO.geocode('Madrid, Spain', function(data) {
      expect(data.length).toEqual(1);
      expect(data[0].lat).toEqual('40.4203');
      expect(data[0].lon).toEqual('-3.70577');
      expect(data[0].boundingbox).toBeTruthy();
    });
  });

  it('we should don\'t get a direction that doesn\'t exist using YAHOO', function() {
    cdb.geo.geocoder.YAHOO.geocode('Wadusworld', function(data) {
      expect(data.length).toEqual(0);
    });
  });

  it('we should get a direction that exists using NOKIA', function() {
    cdb.geo.geocoder.NOKIA.geocode('Madrid, Spain', function(data) {
      expect(data.length).toEqual(1);
      expect(data[0].lat).toEqual(40.420300);
      expect(data[0].lon).toEqual(-3.70577);
      expect(data[0].boundingbox).toBeTruthy();
    });
  });

  it('we should get a direction with # character using NOKIA', function() {
    cdb.geo.geocoder.NOKIA.geocode('# Mexico', function(data) {
      expect(data.length).toEqual(1);
      expect(data[0].lat).toEqual(19.4321);
      expect(data[0].lon).toEqual(-99.1331);
    });
  });

  it('we should don\'t get a direction that doesn\'t exist using NOKIA', function() {
    cdb.geo.geocoder.NOKIA.geocode('Wadusworld', function(data) {
      expect(data.length).toEqual(0);
    });
  });
});