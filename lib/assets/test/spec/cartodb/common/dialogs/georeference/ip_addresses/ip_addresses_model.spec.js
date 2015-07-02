var IpAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/ip_addresses/ip_addresses_model');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/ip_addresses/ip_addresses_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new IpAddressesModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.model.set({
        columnName: 'col'
      });
      this.model.continue();
      this.geocodeData = this.model.get('geocodeData');
    });

    it('should set the geocodeData directly', function() {
      expect(this.geocodeData.type).toEqual('ip');
      expect(this.geocodeData.column_name).toEqual('col');
      expect(this.geocodeData.kind).toEqual('ipaddress');
      expect(this.geocodeData.geometry_type).toEqual('point');
      expect(this.geocodeData.location).toBeUndefined();
      expect(this.geocodeData.text).toBeUndefined();
    });
  });
});
