var StreetAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_model');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/street_addresses/street_addresses_model', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new StreetAddressesModel({
      geocodeStuff: this.geocodeStuff,
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
  });

  describe('.continue', function() {
    beforeEach(function() {
      this.model.set({
        canContinue: true,
        type: 'address',
        kind: 'high-resolution'
      });
      this.model.continue();
      this.geocodeData = this.model.get('geocodeData');
    });

    it('should set the geocodeData directly', function() {
      expect(this.geocodeData.type).toEqual('address');
      expect(this.geocodeData.kind).toEqual('high-resolution');
      expect(this.geocodeData.location).toBeUndefined();
      expect(this.geocodeData.text).toBeUndefined();
    });
  });
});
