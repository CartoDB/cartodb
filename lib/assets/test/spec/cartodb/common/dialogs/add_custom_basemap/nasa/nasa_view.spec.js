var NASAView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/nasa/nasa_view.js');
var NASAModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/nasa/nasa_model.js');

describe('common/dialog/add_custom_basemap/nasa/nasa_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new NASAModel({
      baseLayers: this.baseLayers
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the set button as disabled initially', function() {
      expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
