var cdb = require('cartodb.js-v3');
var FooterView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/footer_view');

describe('common/dialog/merge_datasets/footer_view', function() {
  beforeEach(function() {
    this.model = new cdb.core.Model();
    this.view = new FooterView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render label', function() {
    expect(this.view.$('.js-next').html()).toContain('next');
  });

  it('should set next button state based on model attr', function() {
    expect(this.view.$('.js-next').hasClass('is-disabled')).toBe(true);
    this.model.set('isReadyForNextStep', true);
    expect(this.view.$('.js-next').hasClass('is-disabled')).toBe(false);
    this.model.set('isReadyForNextStep', false);
    expect(this.view.$('.js-next').hasClass('is-disabled')).toBe(true);
  });

  describe('when click next', function() {
    it('should set attr on model to goto next step when ready', function() {
      this.view.$('.js-next').click();
      expect(this.model.get('gotoNextStep')).toBeFalsy();

      this.model.set('isReadyForNextStep', true);
      this.view.$('.js-next').click();
      expect(this.model.get('gotoNextStep')).toBe(true);
    });
  });

  describe('when created with an info view', function() {
    beforeEach(function() {
      this.view.clean();
      this.infoView = new cdb.core.View();
      this.view = new FooterView({
        model: this.model,
        nextLabel: 'merge',
        infoView: this.infoView
      });
      this.view.render();
    });

    it('should render info view', function() {
      expect(this.view.$('.js-info').html()).toContain('<div>');
    });

    it('should render custom next label since given when created view', function() {
      expect(this.view.$('.js-next').html()).toContain('merge');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
