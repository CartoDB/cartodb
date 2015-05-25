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

  it('should render day option as pre-selected', function() {
    expect(this.innerHTML()).toMatch('"day".*checked');
  });

  it('should show date picker', function() {
    expect(this.view.$('.js-date-picker').attr('style')).toBeUndefined();
  });

  describe('when changing from day to night', function() {
    beforeEach(function() {
      this.view.$('input[type=radio][value="night"]').trigger('change');
    });

    it('should hide date picker', function() {
      expect(this.view.$('.js-date-picker').attr('style')).toContain('display: none');
    });

    describe('when changing back to day', function() {
      beforeEach(function() {
        this.view.$('input[type=radio][value="day"]').trigger('change');
      });

      it('should show date picker again', function() {
        expect(this.view.$('.js-date-picker').attr('style')).toContain('display: block');
      });
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
