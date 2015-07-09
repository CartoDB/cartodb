var AdminRegionsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/admin_regions/admin_regions_model');
var GeocodeStuff = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff');

describe('common/dialog/georeference/admin_regions/admin_regions_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuff('table_id');
    this.model = new AdminRegionsModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['foo', 'string'],
        ['lon', 'number'],
        ['bar', 'boolean'],
        ['lat', 'number']
      ]
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should change canContinue when at least a city column name is selected', function() {
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.get('rows').first().set('value', 'col');
    expect(this.model.get('canContinue')).toBe(true);
  });

  describe('when changing step', function() {
    beforeEach(function() {
      this.model.set('step', 1);
    });

    it('should render view to choose geometry method', function() {
      expect(this.innerHTML()).toContain('available geometries');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
