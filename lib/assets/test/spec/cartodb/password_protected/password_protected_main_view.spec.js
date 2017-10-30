var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var MainView = require('../../../../javascripts/cartodb/password_protected/password_protected_main_view');

var CONFIG = {
  hubspot_enabled: true,
  hubspot_token: "yourtoken"
};

describe('password_protected/password_protected_main_view', function () {
  beforeEach(function () {
    this.handleRedirection = jasmine.createSpy('handleRedirection');
    this.view = new MainView({
      data: {
        config: CONFIG
      },
      vizID: 'wadus',
      assetsVersion: 1,
      handleRedirection: this.handleRedirection
    });
    this.view.render();
  });

  it('should init model', function () {
    expect(this.view.model).toBeDefined();
  });

  it('should init vendor script view properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should set the focus on the field after render', function () {
    spyOn(this.view.$('.js-input').get(0),'focus');
    this.view.render();

    expect(this.view.$('.js-input').get(0).focus).toHaveBeenCalled();
  });

  describe('should check password when pressing enter', function () {
    beforeEach(function () {
      spyOn(this.view, '_checkPassword');
      this.event = $.Event('keydown');
      this.event.which = 13;
    });

    it('checkPassword', function () {
      $(document).trigger(this.event);
      expect(this.view._checkPassword).toHaveBeenCalled();
    });
  });

  it('should show the error properly', function () {
    this.view.model.set('error', true);

    expect(this.view.$('.js-input').hasClass('is-error')).toBe(true);
    expect(this.view.$('.CDB-InfoTooltip.is-error').length).toBe(1);
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
