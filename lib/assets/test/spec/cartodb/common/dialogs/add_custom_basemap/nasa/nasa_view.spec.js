var NASAModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/nasa/nasa_model.js');
var $ = require('jquery-cdb-v3');

describe('common/dialog/add_custom_basemap/nasa/nasa_view', function() {
  beforeEach(function() {
    jasmine.clock().install(); // due to date picker
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new NASAModel({
      baseLayers: this.baseLayers
    });
    this.view = this.model.createView();
    this.view.render();

    // necessary for date picker…
    $(document.body).append(this.view.el);
    jasmine.clock().tick(150);
  });

  it('should render day option as pre-selected', function() {
    expect(this.view.$('.js-day .RadioButton-input').hasClass('is-checked')).toBeTruthy();
  });

  it('should show date picker', function() {
    expect(this.view.$('.DatePicker').length).toBe(1);
  });

  it('should render date of yesterday as start date', function() {
    expect(this.innerHTML()).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  describe('when changing from day to night', function() {
    beforeEach(function() {
      this.view.$('.js-night').click();
    });

    it('should disable date picker', function() {
      expect(this.view.$('.DatePicker .DatePicker-dates').hasClass('is-disabled')).toBeTruthy();
    });

    describe('when changing back to day', function() {
      beforeEach(function() {
        this.view.$('.js-day').click();
      });

      it('should enable date picker again', function() {
        expect(this.view.$('.DatePicker .DatePicker-dates').hasClass('is-disabled')).toBeFalsy();
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
