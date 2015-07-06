var IpAddressesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/ip_addresses/ip_addresses_model');
var IpAddressesView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/ip_addresses/ip_addresses_view');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/lon_lat_columns/lon_lat_columns_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new IpAddressesModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
    this.view = new IpAddressesView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should change canContinue once a column is selected for each', function() {
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.set('columnName', 'col');
    expect(this.model.get('canContinue')).toBe(true);
  });

  afterEach(function() {
    this.view.clean();
  });
});
