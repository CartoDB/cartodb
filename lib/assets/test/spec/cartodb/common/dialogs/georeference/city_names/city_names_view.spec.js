var CityNamesModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names/city_names_model');
var CityNamesView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/city_names/city_names_view');

describe('common/dialog/georeference/city_names/city_names_view', function() {
  beforeEach(function() {
    this.model = new CityNamesModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['foo', 'string'],
        ['lon', 'number'],
        ['bar', 'boolean'],
        ['lat', 'number']
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

    this.model.set('cityColumnName', 'cities');
    expect(this.model.get('canContinue')).toBe(true);
  });

  afterEach(function() {
    this.view.clean();
  });
});
