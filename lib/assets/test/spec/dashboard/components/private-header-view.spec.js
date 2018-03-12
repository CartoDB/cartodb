const $ = require('jquery');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const UserModel = require('dashboard/data/user-model');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');
const PrivateHeaderView = require('dashboard/components/private-header-view');
const HeaderViewModel = require('dashboard/views/account/header-view-model');

describe('dashboard/components/private-header-view', function () {
  let user, privateHeaderView;

  beforeEach(function () {
    user = new UserModel({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE'
    });
    spyOn(user, 'bind').and.callThrough();

    privateHeaderView = new PrivateHeaderView({
      model: user,
      configModel: ConfigModelFixture,
      viewModel: new HeaderViewModel()
    });

    spyOn(privateHeaderView, '_renderBreadcrumbsDropdownLink');
    spyOn(privateHeaderView, '_renderNotifications');
    spyOn(privateHeaderView, '_renderLogoLink');
  });

  describe('.render', function () {
    it('should render properly', function () {
      privateHeaderView.render();

      expect(privateHeaderView.$el.html()).toContain('<li class="js-logo">');
      expect(privateHeaderView.$el.html()).toContain('<img src="http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png" class="UserAvatar-img UserAvatar-img--medium">');
      expect(privateHeaderView.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph"><a href="http://pepe.carto.com/dashboard" class="Header-navigationBreadcrumbLink">pepe</a></p> /');

      expect(privateHeaderView._renderBreadcrumbsDropdownLink).toHaveBeenCalled();
      expect(privateHeaderView._renderNotifications).toHaveBeenCalled();
      expect(privateHeaderView._renderLogoLink).toHaveBeenCalled();
    });
  });

  describe('is inside org', function () {
    describe('.render', function () {
      it('should render properly', function () {
        user.isInsideOrg = function () { return true; };
        user.isOrgOwner = function () { return false; };

        user.organization = new Backbone.Model({
          name: 'carto'
        });
        user.organization.owner = new Backbone.Model({
          email: 'owner@carto.com'
        });
        user.organization.isOrgAdmin = function () { return false; };

        privateHeaderView.render();

        expect(privateHeaderView.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph">carto</p> /');
      });
    });
  });

  describe('._initBinds', function () {
    it('should re-render on model change', function () {
      expect(user.bind).toHaveBeenCalledWith('change', privateHeaderView.render, privateHeaderView);
    });
  });

  describe('._renderBreadcrumbsDropdownLink', function () {
    it('should render breadcrumbs dropdown link', function () {
      privateHeaderView._renderBreadcrumbsDropdownLink.and.callThrough();

      privateHeaderView.render();

      expect(privateHeaderView.$el.html()).toContain('<button class="Header-navigationBreadcrumbLink is-disabled">Configuration</button>');
    });
  });

  describe('._renderNotifications', function () {
    it('should render notifications', function () {
      privateHeaderView._renderNotifications.and.callThrough();

      privateHeaderView.render();

      expect(privateHeaderView.$el.html()).toContain('<a href="#/notifications" class="UserNotifications">');
    });
  });

  describe('._renderLogoLink', function () {
    it('should render properly', function () {
      privateHeaderView._renderLogoLink.and.callThrough();

      privateHeaderView.render();

      expect(privateHeaderView.$el.html()).toContain('<a class="Logo" href="http://pepe.carto.com/dashboard">');
    });
  });

  describe('._createSettingsDropdown', function () {
    it('should create settings dropdown', function () {
      const event = $.Event('click');

      spyOn(privateHeaderView, 'killEvent');
      spyOn(privateHeaderView, '_setupDropdown');

      privateHeaderView._createSettingsDropdown(event);

      expect(privateHeaderView.killEvent).toHaveBeenCalledWith(event);
      expect(privateHeaderView._setupDropdown).toHaveBeenCalled();
    });
  });

  describe('._setupDropdown', function () {
    it('should setup dropdown', function () {
      spyOn(privateHeaderView, '_closeAnyOtherOpenDialogs');
      spyOn(privateHeaderView, 'addView');

      const view = new CoreView();
      view.open = jasmine.createSpy('viewOpen');

      spyOn(view, 'render');
      spyOn(view, 'clean');

      privateHeaderView._setupDropdown(view);

      expect(privateHeaderView.addView).toHaveBeenCalled();

      expect(view.render).toHaveBeenCalled();
      expect(view.open).toHaveBeenCalled();

      view.trigger('onDropdownHidden');

      expect(view.clean).toHaveBeenCalled();
    });
  });

  it('should not have leaks', function () {
    privateHeaderView.render();

    expect(privateHeaderView).toHaveNoLeaks();
  });

  afterEach(function () {
    privateHeaderView.clean();
  });
});
