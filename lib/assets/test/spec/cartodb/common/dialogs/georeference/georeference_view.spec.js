var cdb = require('cartodb.js');
var $ = require('jquery');
var GeoreferenceView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/georeference_view');

fdescribe('common/dialog/georeference/georeference_view', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('a');
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
      $(this.view.$('.js-tabs button').last()).click();
    });

    it('should unselect current item and select the new one', function() {
      var $selectedTabs = this.view.$('.js-tabs .is-selected');
      expect($selectedTabs.length).toEqual(1);
      expect($selectedTabs[0].innerHTML).toContain('Street');
    });

    it('should change the content', function() {
      expect(this.innerHTML()).not.toContain('latitude');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
