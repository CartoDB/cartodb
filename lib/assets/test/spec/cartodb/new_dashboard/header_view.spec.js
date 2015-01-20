var HeaderView = require('new_dashboard/header_view');
var Backbone = require('backbone');
var $ = require('jquery');
var cdbAdmin = require('cdb.admin');
var UserUrl = require('new_common/urls/user_model');
var Router = require('new_dashboard/router');


describe('new_dashboard/header_view', function() {
  beforeEach(function() {
    // In production is relying on DOM rendered server-side
    var $el = $('<div>' +
      '<p class="js-logo"></p>' +
      '<a id="header-settings-dropdown" href="#">User settings dropdown</a>' +"\n"+
      '<li id="header-breadcrumbs-dropdown"></li>' +"\n"+
      '<div class="Header-settingsItemNotifications js-user-notifications"></div>' +"\n"+
    '</div>');
    
    this.user = new cdbAdmin.User({
      username: 'pepe'
    });
    
    this.router = new Router({
      currentUserUrl: new UserUrl({
        user: this.user
      })
    });
    this.router.model.set('content_type', 'datasets');
    spyOn(this.router.model, 'bind');
    
    this.localStorage = new Backbone.Model();

    this.userNotificationsEl = $('<div>UserNotifications content</div>');
    this.userNotificationsMock = jasmine.createSpyObj('fake-UserNotificationsView-object', ['render', 'on', 'open', 'clean']);
    this.userNotificationsMock.render.and.returnValue({
      el: this.userNotificationsEl
    });
    this.UserNotificationsSpy = jasmine.createSpy('fake-UserNotificationsView-constructor');
    this.UserNotificationsSpy.and.returnValue(this.userNotificationsMock);
    HeaderView.__set__('UserNotifications', this.UserNotificationsSpy);

    this.view = new HeaderView({
      el: $el,
      model: this.user,
      router: this.router,
      localStorage: this.localStorage
    });
    $(document.body).append($el);
  });

  it('should render on change events by router model', function() {
    var args = this.router.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view.render);
    expect(args[2]).toEqual(this.view);
  });

  it('should render user notifications', function() {
    this.view.render();
    expect(this.view.el.innerHTML).toContain('UserNotifications content');
  });

  it('should have created user notifications view with expected args', function() {
    this.view.render();
    expect(this.UserNotificationsSpy).toHaveBeenCalled();
    var viewToBeInstantiatedWith = this.UserNotificationsSpy.calls.argsFor(0)[0];
    expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ user: this.user }));
    expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ router: this.router }));
    expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ localStorage: this.localStorage }));
  });

  describe('.render', function() {
    it('should have no leaks', function() {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });

    it('should clear sub views', function() {
      var spy = spyOn(this.view, 'clearSubViews');
      this.view.render();

      expect(spy).toHaveBeenCalled();
    });

    it('should render the breadcrumbs dropdown link', function() {
      this.view.render();
      expect(this.innerHTML()).toContain('Datasets');
    });

    it('should render the logo with link', function() {
      this.view.render();
      expect(this.innerHTML()).toMatch('<a href="(.*)/dashboard"');
    });
  });

  describe('.click #header-settings-dropdown', function() {
    beforeEach(function() {
      this.settingsDropdownMock = jasmine.createSpyObj('fake-SettingsDropdown-object', ['render', 'on', 'open', 'clean']);
      this.settingsDropdownMock.options = {
        target: jasmine.createSpyObj('dropdown-target-element', ['unbind'])
      };
      this.SettingsDropdownSpy = jasmine.createSpy('fake-SettingsDropdown-constructor');
      this.SettingsDropdownSpy.and.returnValue(this.settingsDropdownMock);
      HeaderView.__set__('SettingsDropdown', this.SettingsDropdownSpy);

      this.view.render();

      this.clickSettings = function() {
        this.view.$('#header-settings-dropdown').click();
      }
    });

    it('should create a settings dropdown with expected params', function() {
      this.clickSettings();

      expect(this.SettingsDropdownSpy).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.SettingsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ model: this.user }));
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ router: this.router }));
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ template_base: 'new_dashboard/header/settings_dropdown' }));
      expect(viewToBeInstantiatedWith.target[0]).toEqual(this.view.$('#header-settings-dropdown')[0]);
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickSettings();
      expect(this.settingsDropdownMock.render).toHaveBeenCalled();
      expect(this.settingsDropdownMock.open).toHaveBeenCalled();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      var spy = spyOn(this.view, 'killEvent');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(this.view, 'addView');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should clean up dropdown view after the dropdown is hidden', function() {
      this.clickSettings();

      expect(this.settingsDropdownMock.on).toHaveBeenCalledWith('onDropdownHidden', jasmine.any(Function), this.view);

      // trigger the listener callback manually to verify assertions below
      this.settingsDropdownMock.on.calls.argsFor(0)[1].call(this.view);

      expect(this.settingsDropdownMock.clean).toHaveBeenCalled();
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickSettings();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });

  describe('.click #breadcrumbs-settings-dropdown', function() {
    beforeEach(function() {
      this.breadcrumbsDropdownMock = jasmine.createSpyObj('fake-BreadcrumbsDropdown-object', ['render', 'on', 'open', 'clean']);
      this.breadcrumbsDropdownMock.options = {
        target: jasmine.createSpyObj('dropdown-target-element', ['unbind'])
      };
      this.BreadcrumbsDropdownSpy = jasmine.createSpy('fake-BreadcrumbsDropdown-constructor');
      this.BreadcrumbsDropdownSpy.and.returnValue(this.breadcrumbsDropdownMock);
      HeaderView.__set__('BreadcrumbsDropdown', this.BreadcrumbsDropdownSpy);

      this.view.render();

      this.clickBreadcrumbs = function() {
        this.view.$('#header-breadcrumbs-dropdown').click();
      }
    });

    it('should create a breadcrumbs dropdown with expected params', function() {
      this.clickBreadcrumbs();

      expect(this.BreadcrumbsDropdownSpy).toHaveBeenCalled();

      var viewToBeInstantiatedWith = this.BreadcrumbsDropdownSpy.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ model: this.user }));
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ router: this.router }));
      expect(viewToBeInstantiatedWith).toEqual(jasmine.objectContaining({ template_base: 'new_dashboard/header/breadcrumbs/dropdown' }));
      expect(viewToBeInstantiatedWith.target[0]).toEqual(this.view.$('#header-breadcrumbs-dropdown')[0]);
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickBreadcrumbs();
      expect(this.breadcrumbsDropdownMock.render).toHaveBeenCalled();
      expect(this.breadcrumbsDropdownMock.open).toHaveBeenCalled();
    });

    it('should kill the click event from propagating etc., to not trigger any event listeners on body', function() {
      var spy = spyOn(this.view, 'killEvent');
      this.clickBreadcrumbs();
      expect(spy).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(this.view, 'addView');
      this.clickBreadcrumbs();
      expect(spy).toHaveBeenCalled();
    });

    it('should clean up dropdown view after the dropdown is hidden', function() {
      this.clickBreadcrumbs();

      expect(this.breadcrumbsDropdownMock.on).toHaveBeenCalledWith('onDropdownHidden', jasmine.any(Function), this.view);

      // trigger the listener callback manually to verify assertions below
      this.breadcrumbsDropdownMock.on.calls.argsFor(0)[1].call(this.view);

      expect(this.breadcrumbsDropdownMock.clean).toHaveBeenCalled();
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickBreadcrumbs();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });

  afterEach(function() {
    this.view.clean();
  })
});
