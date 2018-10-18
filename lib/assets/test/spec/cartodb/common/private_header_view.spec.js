var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../../../../javascripts/cartodb/common/private_header_view');
var HeaderViewModel = require('../../../../javascripts/cartodb/profile/header_view_model');
var LocalStorage = require('../../../../javascripts/cartodb/common/local_storage');

describe('common/private_header_view', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });
    spyOn(this.user, 'bind').and.callThrough();

    this.view = new HeaderView({
      model: this.user,
      viewModel: new HeaderViewModel(),
      localStorage: new LocalStorage()
    });
    spyOn(this.view, '_renderBreadcrumbsDropdownLink');
    spyOn(this.view, '_renderNotifications');
    spyOn(this.view, '_renderLogoLink');
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<li class="js-logo">');
      expect(this.view.$el.html()).toContain('<img src="http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png" class="UserAvatar-img UserAvatar-img--medium">');
      expect(this.view.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph"><a href="http://pepe.carto.com/dashboard" class="Header-navigationBreadcrumbLink">pepe</a></p> /');

      expect(this.view._renderBreadcrumbsDropdownLink).toHaveBeenCalled();
      expect(this.view._renderNotifications).toHaveBeenCalled();
      expect(this.view._renderLogoLink).toHaveBeenCalled();
    });
  });

  describe('is inside org', function () {
    describe('.render', function () {
      it('should render properly', function () {
        this.user.isInsideOrg = function () { return true; };
        this.user.isOrgOwner = function () { return false; };

        this.user.organization = new cdb.core.Model({
          name: 'carto'
        });
        this.user.organization.owner = new cdb.core.Model({
          email: 'owner@carto.com'
        });
        this.user.organization.isOrgAdmin = function () { return false; };

        this.view.render();

        expect(this.view.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph">carto</p> /');
      });
    });
  });

  describe('._initBinds', function () {
    it('should re-render on model change', function () {
      expect(this.user.bind).toHaveBeenCalledWith('change', this.view.render, this.view);
    });
  });

  describe('._renderBreadcrumbsDropdownLink', function () {
    it('should render breadcrumbs dropdown link', function () {
      this.view._renderBreadcrumbsDropdownLink.and.callThrough();

      this.view.render();

      expect(this.view.$el.html()).toContain('<button class="Header-navigationBreadcrumbLink is-disabled">Configuration</button>');
    });
  });

  describe('._renderNotifications', function () {
    it('should render notifications', function () {
      this.view._renderNotifications.and.callThrough();

      this.view.render();

      expect(this.view.$el.html()).toContain('<a href="#/notifications" class="UserNotifications">');
    });
  });

  describe('._renderLogoLink', function () {
    it('should render properly', function () {
      this.view._renderLogoLink.and.callThrough();

      this.view.render();

      expect(this.view.$el.html()).toContain('<a class="Logo" href="http://pepe.carto.com/dashboard">');
    });
  });

  describe('._createSettingsDropdown', function () {
    it('should create settings dropdown', function () {
      var event = $.Event('click');

      spyOn(this.view, 'killEvent');
      spyOn(this.view, '_setupDropdown');

      this.view._createSettingsDropdown(event);

      expect(this.view.killEvent).toHaveBeenCalledWith(event);
      expect(this.view._setupDropdown).toHaveBeenCalled();
    });
  });

  describe('._setupDropdown', function () {
    it('should setup dropdown', function () {
      spyOn(this.view, '_closeAnyOtherOpenDialogs');
      spyOn(this.view, 'addView');

      var view = new cdb.core.View();
      view.open = jasmine.createSpy('viewOpen');

      spyOn(view, 'render');
      spyOn(view, 'clean');

      this.view._setupDropdown(view);

      expect(this.view._closeAnyOtherOpenDialogs).toHaveBeenCalled();
      expect(this.view.addView).toHaveBeenCalled();

      expect(view.render).toHaveBeenCalled();
      expect(view.open).toHaveBeenCalled();

      view.trigger('onDropdownHidden');

      expect(view.clean).toHaveBeenCalled();
    });
  });

  describe('._closeAnyOtherOpenDialogs', function () {
    it('should close any other open dialogs', function () {
      spyOn(cdb.god, 'trigger');

      this.view._closeAnyOtherOpenDialogs();

      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });

  it('should not have leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
