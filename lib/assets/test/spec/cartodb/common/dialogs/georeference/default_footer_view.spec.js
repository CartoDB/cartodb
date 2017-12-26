var cdb = require('cartodb.js-v3');
var DefaultFooterView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/default_footer_view');
var GeocodeStuffModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/geocode_stuff_model');

describe('common/dialog/georeference/default_footer_view', function() {
  beforeEach(function() {
    this.geocodeStuff = new GeocodeStuffModel({
      tableName: 'foobar'
    });
    this.model = new cdb.core.Model({
      geocodeStuff: this.geocodeStuff
    });
    this.model.continue = jasmine.createSpy('continue');
    this.view = new DefaultFooterView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when canContinue changes', function() {
    it('should update the disabled state on the continue button', function() {
      this.model.set('canContinue', true);
      expect(this.view.$('.ok').hasClass('is-disabled')).toBe(false);

      this.model.set('canContinue', false);
      expect(this.view.$('.ok').hasClass('is-disabled')).toBe(true);
    });
  });

  describe('when hideFooter is changed', function() {
    it('should hide or show footer', function() {
      expect(this.view.$el.attr('style')).not.toContain('none');

      this.model.set('hideFooter', true);
      expect(this.view.$el.attr('style')).toContain('none');

      this.model.set('hideFooter', false);
      expect(this.view.$el.attr('style')).not.toContain('none');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
