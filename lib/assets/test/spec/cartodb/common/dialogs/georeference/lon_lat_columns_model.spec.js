var LonLatColumnsModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/lon_lat_columns_model');
var GeocodeStuffModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff_model');

describe('common/dialog/georeference/lon_lat_columns_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuffModel({
      tableName: 'table_id'
    });
    this.model = new LonLatColumnsModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
    this.view = this.model.createView(); // called when each view is about to be used, should reset state
  });

  describe('.assertIfCanContinue', function() {
    it('should return true when all rows has a value', function() {
      this.model.assertIfCanContinue();
      expect(this.model.get('canContinue')).toBe(false);

      var rows = this.model.get('rows');
      rows.first().set('value', 'lon');
      this.model.assertIfCanContinue();
      expect(this.model.get('canContinue')).toBe(false);

      rows.last().set('value', 'lat');
      this.model.assertIfCanContinue();
      expect(this.model.get('canContinue')).toBe(true);
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      var rows = this.model.get('rows');
      rows.first().set('value', 'lon1');
      rows.last().set('value', 'lat2');
      this.model.continue();
      this.geocodeData = this.model.get('geocodeData');
    });

    it('should set the geocodeData directly', function() {
      expect(this.geocodeData.type).toEqual('lonlat');
      expect(this.geocodeData.longitude).toEqual('lon1');
      expect(this.geocodeData.latitude).toEqual('lat2');
      expect(this.geocodeData.location).toBeUndefined();
      expect(this.geocodeData.text).toBeUndefined();
    });
  });
});
