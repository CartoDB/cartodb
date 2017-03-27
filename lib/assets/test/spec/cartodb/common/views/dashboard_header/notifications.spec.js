var NotificationsDropdown = require('../../../../../../javascripts/cartodb/common/views/dashboard_header/notifications/dropdown_view');
var UserNotifications = require('../../../../../../javascripts/cartodb/common/views/dashboard_header/notifications/view');
var cdbAdmin = require('cdb.admin');
var LocalStorage = require('../../../../../../javascripts/cartodb/common/local_storage');
var NotificationsModel = require('../../../../../../javascripts/cartodb/common/views/dashboard_header/notifications/model');
var OrganizationNotificationsModel = require('../../../../../../javascripts/cartodb/common/views/dashboard_header/notifications/organization-model');

describe("common/views/dashboard_header/notifications/view", function() {
  var view, user;

  beforeEach(function() {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/notifications')).andReturn({
      status: 200
    });

    window.organization_notifications = [
      {
        id: 'n-1',
        icon: 'alert',
        html_body: '<p>html_body</p>\n',
        received_at: '2017-03-24T16:58:28+00:00',
        read_at: null
      }
    ];

    this.localStorage = new LocalStorage('test');
    this.localStorage.remove('notification.close_limits');

    user = new cdbAdmin.User({
      base_url: 'http://coronelli.carto.com/u/test-user',
      account_type: 'CORONELLI',
      remaining_byte_quota: 900,
      quota_in_bytes: 1000,
      trial_ends_at: null,
      username: 'test-user',
      table_count: 1,
      id: 123,
      api_key: 'xyz123'
    });

    spyOn(NotificationsDropdown.prototype, 'initialize').and.callThrough();
    spyOn(OrganizationNotificationsModel.prototype, 'initialize').and.callThrough();
    spyOn(OrganizationNotificationsModel.prototype, 'markAsRead').and.callThrough();

    view = new UserNotifications({
      user: user,
      localStorage: this.localStorage
    });
  });

  describe('render', function() {
    it('should render properly', function() {
      view.render();
      expect(view.$el.hasClass('UserNotifications')).toBeTruthy();
      expect(view.$('.UserNotifications-Icon').length).toBe(1);
      expect(view.$('.UserNotifications-badge').length).toBe(1);
      expect(view.$('.UserNotifications-badge').text()).toBe('1');
      expect(view.$el.hasClass('has--alerts')).toBeTruthy();

      user.set('remaining_byte_quota', 10);
      expect(view.$('.UserNotifications-badge').length).toBe(1);
      expect(view.$('.UserNotifications-badge').text()).toBe('2');
      expect(view.$el.hasClass('has--alerts')).toBeTruthy();

      user.set('remaining_byte_quota', 1000);
      expect(view.$('.UserNotifications-badge').length).toBe(1);
      expect(view.$('.UserNotifications-badge').text()).toBe('1');
      expect(view.$el.hasClass('has--alerts')).toBeTruthy();
    });

    it('should have no leaks', function() {
      view.render();
      expect(view).toHaveNoLeaks();
    });

  });

  describe('click', function() {
    beforeEach(function() {
      view.render();
      spyOn(NotificationsDropdown.prototype, 'render').and.callThrough();
      spyOn(NotificationsDropdown.prototype, 'open').and.callThrough();
      spyOn(NotificationsDropdown.prototype, 'on');
      spyOn(NotificationsDropdown.prototype, 'clean').and.callThrough();

      this.clickSettings = function() {
        view.$el.click();
      };
    });

    it('should create dropdown view with expected params', function() {
      this.clickSettings();
      expect(NotificationsDropdown.prototype.initialize).toHaveBeenCalled();
      expect(OrganizationNotificationsModel.prototype.initialize).toHaveBeenCalledTimes(1);

      var viewToBeInstantiatedWith = NotificationsDropdown.prototype.initialize.calls.argsFor(0)[0];
      expect(viewToBeInstantiatedWith.target[0]).toEqual(view.$el[0]);
      expect(viewToBeInstantiatedWith.template_base).toEqual('common/views/dashboard_header/notifications/templates/dropdown');
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickSettings();
      expect(NotificationsDropdown.prototype.render).toHaveBeenCalled();
      expect(NotificationsDropdown.prototype.open).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(view, 'addView');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should mark organization notification as read after the dropdown is hidden', function(done) {
      expect(view.collection.length).toBe(1);

      this.clickSettings();

      // trigger the listener callback manually to verify assertions below
      view._onDropdownHidden(view.notification);

      setTimeout(function() {
        expect(OrganizationNotificationsModel.prototype.markAsRead).toHaveBeenCalledTimes(1);
        expect(view.collection.length).toBe(0);
        done();
      }, 400);
    });

    it('should clean up dropdown view after the dropdown is hidden', function(done) {
      this.clickSettings();

      expect(NotificationsDropdown.prototype.on).toHaveBeenCalledWith('onDropdownHidden', jasmine.any(Function), view);

      // trigger the listener callback manually to verify assertions below
      view._onDropdownHidden(view.notification);

      setTimeout(function() {
        expect(NotificationsDropdown.prototype.clean).toHaveBeenCalled();
        expect(view.$el.hasClass('has--alerts')).toBeFalsy();
        done();
      }, 400);
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickSettings();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });
  });


  describe('collection', function() {
    it('should generate collection data', function() {
      expect(view.collection.size()).toBe(1);
    });

    it('should reset collection data when user data is changed', function() {
      var spy = spyOn(view.collection, 'reset');
      user.set('remaining_byte_quota', 10);
      expect(spy).toHaveBeenCalled();
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();

    view.clean();
  });

});
