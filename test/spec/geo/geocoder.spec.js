
// Yahoo geocoder

describe('Geocoder', function() {

  it('we should get a direction that exists', function() {
    cdb.geo.geocoder.YAHOO.geocode('Madrid, Spain', function(data) {
      expect(data.length).toEqual(1);
      expect(data[0].lat).toEqual('40.420300');
      expect(data[0].lon).toEqual('-3.705774');
      expect(data[0].boundingbox).toBeTruthy();
    });
  });

  it('we should don\'t get a direction that doesn\'t exist', function() {
    cdb.geo.geocoder.YAHOO.geocode('Wadusworld', function(data) {
      expect(data.length).toEqual(0);
    });
  });
});