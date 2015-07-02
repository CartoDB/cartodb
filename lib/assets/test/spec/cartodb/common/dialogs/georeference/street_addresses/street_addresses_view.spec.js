var StreetAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_model');
var StreetAddressesView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/street_addresses/street_addresses_view');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/street_addresses/street_addresses_view', function() {
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
    this.view = new StreetAddressesView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
