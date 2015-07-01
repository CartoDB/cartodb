var cdb = require('cartodb.js');
var $ = require('jquery');
var GeoreferenceView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/georeference_view');

describe('common/dialog/georeference/georeference_view', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('a', [
      ['cartodb_id', 'string'],
      ['the_geom', 'geometry'],
      ['lon', 'number'],
      ['lat', 'number'],
      ['cartodb_georef_status', 'string'],
      ['foobar', 'boolean'],
      ['updated_at', 'date'],
      ['created_at', 'date']
    ]);
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.cartodb.com'
    });
    this.view = new GeoreferenceView({
      table: this.table,
      user: this.user
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the different tabs', function() {
    expect(this.innerHTML()).toContain('Lon/Lat Columns');
    expect(this.innerHTML()).toContain('City Names');
    expect(this.innerHTML()).toContain('Admin. Regions');
    expect(this.innerHTML()).toContain('Postal Codes');
    expect(this.innerHTML()).toContain('IP Addresses');
    expect(this.innerHTML()).toContain('Street Addresses');
  });

  it('should start on the lon/lat column', function() {
    var $selectedTabs = this.view.$('.js-tabs .is-selected');
    expect($selectedTabs.length).toEqual(1);
    expect($selectedTabs[0].innerHTML).toContain('Lon/Lat');
    expect(this.innerHTML()).toContain('latitude');
  });

  describe('when selecting another tab', function() {
    beforeEach(function() {
      $(this.view.$('.js-tabs button').get(1)).click();
    });

    it('should unselect current item and select the new one', function() {
      var $selectedTabs = this.view.$('.js-tabs .is-selected');
      expect($selectedTabs.length).toEqual(1);
      expect($selectedTabs[0].innerHTML).toContain('City');
    });

    it('should change the content', function() {
      expect(this.innerHTML()).not.toContain('latitude');
    });
  });

  describe('when canContinue changes on the current selected tab model', function() {
    it('should update the disabled state on the continue button', function() {
      expect(this.view.$('.ok').hasClass('is-disabled')).toBe(true);
      this.view.model.get('options').first().set('canContinue', true);
      expect(this.view.$('.ok').hasClass('is-disabled')).toBe(false);
    });
  });

  describe('when clicking continue', function() {
    beforeEach(function() {
      spyOn(this.view.model, 'continue');
      this.view.$('.ok').click();
    });

    it('should call continue on the model', function() {
      expect(this.view.model.continue).toHaveBeenCalled();
    });
  });

  describe('when geocodeData changes on a tab model', function() {
    beforeEach(function() {
      spyOn(this.view, 'hide');
      this.geocodingChosenSpy = jasmine.createSpy('geocodingChosen');
      this.view.bind('geocodingChosen', this.geocodingChosenSpy);
      this.geocodeData = { foobar: 'baz!' };
      this.view.model.get('options').first().set('geocodeData', this.geocodeData);
    });

    it('should trigger geocodingChosen event with the data set', function() {
      expect(this.geocodingChosenSpy).toHaveBeenCalled();
      expect(this.geocodingChosenSpy.calls.argsFor(0)[0]).toEqual(this.geocodeData);
    });

    it('should hide the view', function() {
      expect(this.view.hide).toHaveBeenCalled();
      // should also delete on hide, so assert it's set too
      expect(this.view.options.clean_on_hide).toBe(true);
    });
  });

  it('should updates the ok button label for tab change', function() {
    // Default
    expect(this.view.$('.ok').text()).toContain('Continue');

    // Change to custom label
    this.view.model.get('options').first().set('continueLabel', 'Bampadam');
    expect(this.view.$('.ok').text()).toContain('Bampadam');

    // Change tab should reset the label
    this.view.model.get('options').at(1).set('selected', true);
    expect(this.view.$('.ok').text()).toContain('Continue');
  });

  afterEach(function() {
    this.view.clean();
  });
});
