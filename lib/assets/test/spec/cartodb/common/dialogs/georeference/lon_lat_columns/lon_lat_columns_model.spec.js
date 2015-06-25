var LonLatColumnsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/lon_lat_columns/lon_lat_columns_model');

describe('common/dialog/georeference/lon_lat_columns/lon_lat_columns_model', function() {
  beforeEach(function() {
    this.model = new LonLatColumnsModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
  });

  describe('.geocodeData', function() {
    beforeEach(function() {
      this.model.set({
        lonColumnName: 'lon1',
        latColumnName: 'lat2'
      });

      this.results = this.model.geocodeData();
    });

    it('should have a type of value lonlat set', function() {
      expect(this.results.type).toEqual('lonlat');
    });

    it('should also contain the table column names to use for lon/lat geocoding', function() {
      expect(this.results.longitude).toEqual('lon1');
      expect(this.results.latitude).toEqual('lat2');
    });
  });
});
