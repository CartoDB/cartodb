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

  describe('when user written a URL', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    describe('when URL is half-done or invalid', function() {
      beforeEach(function() {
        var $el = this.view.$('.js-url');
        $el.val('htt');
        $el.trigger('keydown');
        $el.val('http://{s}.basem');
        $el.trigger('keydown');
        jasmine.clock().tick(200);
      });

      it('should show error', function() {
        expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
        expect(this.innerHTML()).toContain('does not look like a valid XYZ URL');
      });

      it('should disable OK button', function() {
        expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
      });
    });

    describe('when finally written/pasted a valid URL', function() {
      beforeEach(function() {
        var $el = this.view.$('.js-url');
        $el.val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png');
        $el.trigger('keydown');
      });

      it('should have updated the url value on view model', function() {
        expect(this.model.get('layer')).toBeUndefined();
        jasmine.clock().tick(200);
        expect(this.model.get('layer')).toEqual(jasmine.any(Object));
        expect(this.model.get('layer').get('urlTemplate')).toEqual('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png');
      });

      it('should enable the save button', function() {
        jasmine.clock().tick(200);
        expect(this.view.$('.ok').attr('class')).not.toContain('is-disabled');
      });

      it('should hide error', function() {
        jasmine.clock().tick(200);
        expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
      });
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
