var cdb = require('cartodb.js');
var MapboxViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/mapbox/mapbox_model.js');

describe('common/dialog/add_custom_basemap/mapbox/mapbox_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new MapboxViewModel({
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the inputs', function() {
    expect(this.view.$('input').length).toEqual(2);
  });

  describe('when click save', function() {
    beforeEach(function() {
      spyOn(this.model, 'save').and.callThrough();
      this.view.$('.js-ok').click();
    });

    it('should call save on model', function() {
      expect(this.model.save).toHaveBeenCalled();
    });

    it('should show the loading message', function() {
      expect(this.innerHTML()).toContain('Validating');
      expect(this.view.$('input').length).toEqual(0);
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
