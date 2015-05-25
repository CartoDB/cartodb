var NASAModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/nasa/nasa_model.js');
var $ = require('jquery');

describe('common/dialog/add_custom_basemap/nasa/nasa_view', function() {
  beforeEach(function() {
    jasmine.clock().install(); // due to date picker
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new NASAModel({
      baseLayers: this.baseLayers
    });
    this.view = this.model.createView();
    this.model.set('date', '2015-05-25');
    this.view.render();

    // necessary for date picker…
    $(document.body).append(this.view.el);
    jasmine.clock().tick(150);
  });

  it('should render day option as pre-selected', function() {
    expect(this.innerHTML()).toMatch('"day".*checked');
  });

  it('should show date picker', function() {
    expect(this.view.$('.js-date-picker').attr('style')).toBeUndefined();
  });

  it('should render current date as start date', function() {
    expect(this.innerHTML()).toContain('2015-05-25');
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
    jasmine.clock().uninstall();
  });
});
