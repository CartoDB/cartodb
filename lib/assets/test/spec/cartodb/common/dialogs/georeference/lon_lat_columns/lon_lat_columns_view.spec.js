var LonLatColumnsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/lon_lat_columns/lon_lat_columns_model');
var LonLatColumnsView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/lon_lat_columns/lon_lat_columns_view');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/lon_lat_columns/lon_lat_columns_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new LonLatColumnsModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat']
    });
    this.view = new LonLatColumnsView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should change canContinue once a column is selected for each', function() {
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.set('longitude', 'lon');
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.set('latitude', 'lat');
    expect(this.model.get('canContinue')).toBe(true);
  });

  afterEach(function() {
    this.view.clean();
  });
});
