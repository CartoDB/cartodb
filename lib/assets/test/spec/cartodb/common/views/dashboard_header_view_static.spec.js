var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var HeaderView = require('../../../../../javascripts/cartodb/common/views/dashboard_header_view_static');
var HeaderViewModel = require('../../../../../javascripts/cartodb/dashboard/header_view_model');
var Router = require('../../../../../javascripts/cartodb/dashboard/router');
var LocalStorage = require('../../../../../javascripts/cartodb/common/local_storage');

describe('common/views/dashboard_header_view_static', function () {
  beforeEach(function () {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com',
      email: 'pepe@carto.com',
      account_type: 'FREE',
      avatar_url: 'avatar'
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });

    var collection = new cdb.admin.Visualizations();
    var localStorage = new LocalStorage();

    spyOn(HeaderView.prototype, '_stopLogoAnimation');

    this.view = new HeaderView({
      model: this.user,
      viewModel: new HeaderViewModel(this.router),
      router: this.router,
      collection: collection,
      localStorage: localStorage
    });
    spyOn(this.view, '_renderBreadcrumbsDropdownLink');
    spyOn(this.view, '_renderNotifications');
    spyOn(this.view, '_renderLogoLink');
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(this.view.$el.html()).toContain('<li class="js-logo">');
      expect(this.view.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph">pepe</p>');
      expect(this.view.$el.html()).toContain('<li class="Header-navigationBreadcrumbItem js-breadcrumb-dropdown CDB-Text CDB-Size-large">');
      expect(this.view.$el.html()).toContain('<img src="avatar" class="UserAvatar-img UserAvatar-img--medium">');

      expect(this.view._renderBreadcrumbsDropdownLink).toHaveBeenCalled();
      expect(this.view._renderNotifications).toHaveBeenCalled();
      expect(this.view._renderLogoLink).toHaveBeenCalled();
    });
  });

  describe('is inside org', function () {
    describe('.render', function () {
      it('should render properly', function () {
        this.user.organization = new cdb.core.Model({
          name: 'carto'
        });
        spyOn(this.user, 'isInsideOrg').and.returnValue(true);

        this.view.render();

        expect(this.view.$el.html()).toContain('<p class="Header-navigationBreadcrumbParagraph">carto</p>');
      });
    });
  });

  describe('._initBinds', function () {
    it('should stop logo animation on collection fetch', function () {
      this.view.collection.reset([{ hello: 'hello' }]);

      expect(HeaderView.prototype._stopLogoAnimation).toHaveBeenCalled();
    });

    it('should stop logo animation on collection error', function () {
      this.view.collection.trigger('error');

      expect(HeaderView.prototype._stopLogoAnimation).toHaveBeenCalled();
    });

    it('should start logo animation on router change', function () {
      spyOn(this.view, '_startLogoAnimation');
      this.view.collection.total_user_entries = 10;

      this.router.model.set({ shared: true });

      expect(this.view._startLogoAnimation).toHaveBeenCalled();

      this.router.model.set({
        shared: false,
        content_type: 'maps'
      });

      expect(this.view._startLogoAnimation.calls.count()).toBe(1);

      this.router.model.set({
        library: true
      });

      expect(this.view._startLogoAnimation.calls.count()).toBe(2);
    });
  });

  describe('._startLogoAnimation', function () {
    it('should start logo animation', function () {
      HeaderView.prototype._stopLogoAnimation.and.callThrough();
      this.view._renderLogoLink.and.callThrough();
      this.view.render();

      expect(this.view.$('.Logo').hasClass('is-loading')).toBe(false);

      this.view._startLogoAnimation();

      expect(this.view.$('.Logo').hasClass('is-loading')).toBe(true);
    });
  });

  describe('._stopLogoAnimation', function () {
    it('should stop logo animation', function () {
      HeaderView.prototype._stopLogoAnimation.and.callThrough();
      this.view._renderLogoLink.and.callThrough();
      this.view.render();

      this.view.$('.Logo').addClass('is-loading');
      expect(this.view.$('.Logo').hasClass('is-loading')).toBe(true);

      this.view._stopLogoAnimation();

      expect(this.view.$('.Logo').hasClass('is-loading')).toBe(false);
    });
  });

  describe('breadcrumb dropdown is enabled', function () {
    describe('._createBreadcrumbsDropdown', function () {
      it('should create breadcrumbs dropdown', function () {
        var event = $.Event('click');

        spyOn(this.view, 'killEvent');
        spyOn(this.view, '_setupDropdown');

        this.view._createBreadcrumbsDropdown(event);

        expect(this.view.killEvent).toHaveBeenCalledWith(event);
        expect(this.view._setupDropdown).toHaveBeenCalled();
      });
    });

    describe('._renderBreadcrumbsDropdownLink', function () {
      it('should render breadcrumbs dropdown link', function () {
        this.view._renderBreadcrumbsDropdownLink.and.callThrough();

        this.view.render();

        expect(this.view.$('.js-breadcrumb-dropdown').html()).toContain('<button class="Header-navigationBreadcrumbLink DropdownLink DropdownLink--white"></button>');
      });
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
