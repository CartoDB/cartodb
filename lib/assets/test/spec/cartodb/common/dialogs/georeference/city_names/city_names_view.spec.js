var CityNamesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names/city_names_model');
var CityNamesView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names/city_names_view');
var GeocodeStuffModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff_model');

describe('common/dialog/georeference/city_names/city_names_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuffModel({
      tableName: 'table_id'
    });
    this.model = new CityNamesModel({
      geocodeStuff: this.geocodeStuff,
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['string', 'foo'],
        ['number', 'lon'],
        ['boolean', 'bar'],
        ['number', 'lat']
      ]
    });
    this.view = new CityNamesView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should change canContinue once at least a city column name is selected', function() {
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.set('columnName', 'stad');
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
