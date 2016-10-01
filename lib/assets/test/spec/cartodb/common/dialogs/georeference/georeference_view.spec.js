var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
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
      actions: {},
      base_url: 'http://pepe.carto.com'
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
    expect(this.innerHTML()).toContain('Latitude');
  });

  it('should not render the flash message about table not been geocoded yet', function() {
    expect(this.innerHTML()).not.toContain('FlashMessage');
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
      expect(this.innerHTML()).not.toContain('Latitude');
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
      spyOn(this.view, 'close');
      this.geocodingChosenSpy = jasmine.createSpy('geocodingChosen');
      cdb.god.bind('geocodingChosen', this.geocodingChosenSpy);
      this.geocodeData = { foobar: 'baz!' };
      this.view.model.get('options').first().set('geocodeData', this.geocodeData);
    });

    it('should trigger geocodingChosen event with the data set', function() {
      expect(this.geocodingChosenSpy).toHaveBeenCalled();
      expect(this.geocodingChosenSpy.calls.argsFor(0)[0]).toEqual(this.geocodeData);
    });

    it('should hide the view', function() {
      expect(this.view.close).toHaveBeenCalled();
      // should also delete on hide, so assert it's set too
      expect(this.view.options.clean_on_hide).toBe(true);
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
