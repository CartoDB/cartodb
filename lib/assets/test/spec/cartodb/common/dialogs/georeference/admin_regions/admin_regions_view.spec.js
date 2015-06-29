var AdminRegionsModel = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/admin_regions/admin_regions_model');
var AdminRegionsView = require('../../../../../../../javascripts/cartodb/common/dialogs/georeference/admin_regions/admin_regions_view');

describe('common/dialog/georeference/admin_regions/admin_regions_view', function() {
  beforeEach(function() {
    this.model = new AdminRegionsModel({
      columnsNames: ['foo', 'lon', 'bar', 'lat'],
      columns: [
        ['foo', 'string'],
        ['lon', 'number'],
        ['bar', 'boolean'],
        ['lat', 'number']
      ]
    });
    this.view = new AdminRegionsView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should change canContinue once at least a city column name is selected', function() {
    expect(this.model.get('canContinue')).toBeFalsy();

    this.model.set('columnName', 'col');
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
