var $ = require('jquery');
var Backbone = require('backbone');
var HeaderView = require('dashboard/components/dashboard-header-view');
var Router = require('dashboard/common/router-dashboard');
var DashboardHeaderViewModel = require('dashboard/views/main/header-view-model');
var UserModel = require('dashboard/data/user-model');
var LocalStorage = require('dashboard/helpers/local-storage');

describe('common/views/dashboard_header_view', function () {
  beforeEach(function () {
    // In production is relying on DOM rendered server-side
    this.$el = $('<div>' +
      '<p class="js-logo"></p>' +
      '<li class="js-breadcrumb-dropdown"></li>' + '\n' +
      '<a class="js-settings-dropdown" href="#">User settings dropdown</a>' + '\n' +
      '<div class="Header-settingsItemNotifications js-user-notifications"></div>' + '\n' +
    '</div>');

    this.user = new UserModel({
      base_url: 'http://pepe.carto.com',
      username: 'pepe',
      account_type: 'FREE',
      id: 123,
      api_key: 'xyz123',
      actions: {
        engine_enabled: true
      }
    }, {
      configModel: new Backbone.Model()
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });
    this.router.model.set('content_type', 'datasets');

    this.headerViewModel = new DashboardHeaderViewModel(this.router);
    spyOn(this.headerViewModel, 'bind');

    this.localStorage = new LocalStorage();

    this.view = new HeaderView({
      el: this.$el,
      model: this.user,
      router: this.router,
      configModel: new Backbone.Model(),
      collection: new Backbone.Collection(),
      viewModel: this.headerViewModel,
      localStorage: this.localStorage
    });
    $(document.body).append(this.view.render().el);
  });

  it('should render breadcrumb links on change events by view model', function () {
    var args = this.headerViewModel.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view._renderBreadcrumbsDropdownLink);
    expect(args[2]).toEqual(this.view);
  });

  it('should render user notifications', function () {
    this.view.render();
    expect(this.view.el.innerHTML).toContain('UserNotifications');
  });

  describe('.render', function () {
    it('should have no leaks', function () {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should clear sub views', function () {
      var spy = spyOn(this.view, 'clearSubViews');
      this.view.render();

      expect(spy).toHaveBeenCalled();
    });

    it('should render the breadcrumbs dropdown link', function () {
      this.view.render();
      expect(this.innerHTML()).toContain('Datasets');
    });

    it('should render the logo with link', function () {
      this.view.render();
      expect(this.innerHTML()).toMatch('<a class="Logo" href="(.*)/dashboard"');
    });
  });

  describe('logo loader', function () {
    it('should start logo animation when a router change is made (content_type not accepted)', function () {
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

    it('should stop logo animation when collection fetch is finished', function () {
      var $el = this.view.$('.Logo');
      this.view.collection.total_user_entries = 10;
      this.router.model.set({ shared: true });
      expect($el.hasClass('is-loading')).toBeTruthy();
      this.view.collection.reset([{ hello: 'hello' }]);
      expect($el.hasClass('is-loading')).toBeFalsy();
    });

    it('should stop logo animation if collection fetch fails', function () {
      var $el = this.view.$('.Logo');
      this.view.collection.total_user_entries = 10;
      this.router.model.set({ shared: true });
      expect($el.hasClass('is-loading')).toBeTruthy();
      this.view.collection.trigger('error');
      expect($el.hasClass('is-loading')).toBeFalsy();
    });
  });

  describe('.click .js-settings-dropdown', function () {
    beforeEach(function () {
      this.view.render();
      spyOn(this.view, 'killEvent').and.callThrough();
      spyOn(this.view, 'addView').and.callThrough();

      this.view.$('.js-settings-dropdown').click();
    });

    afterEach(function () {
      this.view._closeAnyOtherOpenDialogs();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function () {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function () {
      expect(this.view.addView).toHaveBeenCalled();
    });
  });

  describe('.click .js.breadcrumb-dropdown', function () {
    beforeEach(function () {
      this.view.render();
      spyOn(this.view, 'killEvent').and.callThrough();
      spyOn(this.view, 'addView').and.callThrough();
      this.view.$('.js-breadcrumb-dropdown').click();
    });

    afterEach(function () {
      this.view._closeAnyOtherOpenDialogs();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function () {
      expect(this.view.killEvent).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function () {
      expect(this.view.addView).toHaveBeenCalled();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
