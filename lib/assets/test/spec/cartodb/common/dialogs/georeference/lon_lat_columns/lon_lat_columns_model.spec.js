var LonLatColumnsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/lon_lat_columns/lon_lat_columns_model');

describe('common/dialog/georeference/lon_lat_columns/lon_lat_columns_model', function() {
  beforeEach(function() {
    this.model = new LonLatColumnsModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.model.set({
        longitude: 'lon1',
        latitude: 'lat2'
      });
      this.model.continue();
      this.geocodeData = this.model.get('geocodeData');
    });

    it('should set the geocodeData directly', function() {
      expect(this.geocodeData.type).toEqual('lonlat');
      expect(this.geocodeData.longitude).toEqual('lon1');
      expect(this.geocodeData.latitude).toEqual('lat2');
    });
  });
});
