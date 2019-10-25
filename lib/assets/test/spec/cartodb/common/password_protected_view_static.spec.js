var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var MainView = require('../../../../javascripts/cartodb/common/password_protected_view_static');

var CONFIG = {
  user_name: 'foo',
  account_host: 'localhost.lan'
};

describe('public_maps/password_protected_view_static', function () {
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

    spyOn($, 'ajax').and.callFake(function (e) {
      return $.Deferred().resolve().promise();
    });

    spyOn(this.view, '_checkPassword').and.callThrough();

    this.view.render();
    document.body.appendChild(this.view.el);
  });

  it('should init model', function () {
    expect(this.view.model).toBeDefined();
  });

  it('should init vendor script view properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should set the focus on the field after render', function () {
    spyOn(this.view, '_focusInput');
    this.view.render();

    expect(this.view._focusInput).toHaveBeenCalled();
  });

  describe('check password', function () {
    var event;
    beforeEach(function () {
      event = $.Event('keydown');
      event.keyCode = event.which = 13;
    });

    it('should check password when pressing enter', function () {
      this.view.$('.js-input').trigger(event);
      expect(this.view._checkPassword).toHaveBeenCalled();
    });

    it('should make request if password is filled', function () {
      this.view.model.set('password', 'foo');
      this.view.$('.js-input').trigger(event);
      expect(this.view._checkPassword).toHaveBeenCalled();
      expect($.ajax).toHaveBeenCalled();
    });

    it('should avoid request if password is empty', function () {
      this.view.$('.js-input').val('');
      this.view.$('.js-input').trigger(event);
      expect(this.view._checkPassword).toHaveBeenCalled();
      expect($.ajax).not.toHaveBeenCalled();
    });
  });

  it('should show the error properly', function () {
    this.view.model.set('error', true);

    expect(this.view.$('.js-input').hasClass('is-alert')).toBe(true);
    expect(this.view.$('.CDB-InfoTooltip.is-error').length).toBe(1);
  });

  it('should show the home link properly', function () {
    expect(this.view.$('.PublicPage-header a').attr('href')).toContain('http://foo.localhost.lan');
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    this.view.clean();
  });
});
