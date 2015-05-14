var XYZView = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/xyz_view.js');
var XYZViewModel = require('../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/xyz_model.js');

describe('common/dialog/add_custom_basemap/xyz_view', function() {
  beforeEach(function() {
    this.model = new XYZViewModel();
    this.view = new XYZView({
      model: this.model
    });
    this.view.render();
  });

  it('should render the set button as disabled initially', function() {
      expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
  });

  describe('when there is an URL written', function() {
    beforeEach(function() {
      jasmine.clock().install();
      var $el = this.view.$('.js-url');
      $el.val('h');
      $el.trigger('keydown'); // have to trigger it manually to trigger it
      $el.val('http');
      $el.trigger('keydown'); // have to trigger it manually to trigger it
      $el.val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png');
      $el.trigger('keydown'); // have to trigger it manually to trigger it
    });

    it('should have updated the url value on view model, after a certain debounce', function() {
      expect(this.model.get('url')).toEqual('');
      jasmine.clock().tick(200); // for debounced listener to be triggered
      expect(this.model.get('url')).toEqual('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png');
    });

    it('should enable the save button', function() {
      jasmine.clock().tick(200); // for debounced listener to be triggered
      expect(this.view.$('.ok').attr('class')).not.toContain('is-disabled');
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
