var AppNotifications = require('builder/app-notifications');
var ConfigModel = require('builder/data/config-model');

describe('app-notifications', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/rick'
    });

    AppNotifications.init();

    this.model = AppNotifications.addNotification({
      type: 'limit',
      message: 'this is a limit notification'
    });

    AppNotifications.addNotification({
      type: 'widget',
      message: 'this is a widget notification'
    });
  });

  afterEach(function () {
    AppNotifications.off();
  });

  describe('.getByType', function () {
    it('should return the correct model', function () {
      var notification = AppNotifications.getByType('limit');
      expect(notification).toBe(this.model);
    });

    it('should return non-present types', function () {
      var notification = AppNotifications.getByType('condemor');
      expect(notification).toBe(undefined);
    });

    it('should not return muted types', function () {
      AppNotifications.muteByType('limit');
      var notification = AppNotifications.getByType('limit');
      expect(notification).toBe(null);
    });

    it('should return unmuted types', function () {
      AppNotifications.muteByType('limit');
      AppNotifications.unmuteByType('limit');
      var notification = AppNotifications.getByType('limit');
      expect(notification).not.toBe(null);
    });
  });

  describe('.getCollection', function () {
    it('should return the notifications collection', function () {
      var collection = AppNotifications.getCollection();

      expect(collection.length).toEqual(2);
      expect(collection.models[0]).toBe(this.model);
    });
  });

  describe('.getNotification', function () {
    it('should return the correct notification with the model id', function () {
      var notification = AppNotifications.getNotification(this.model.cid);
      expect(notification).toBe(this.model);
    });

    it('should return the correct notification with the model', function () {
      var notification = AppNotifications.getNotification(this.model);
      expect(notification).toBe(this.model);
    });
  });

  describe('.addNotification', function () {
    it('should should add the notification to the collection', function () {
      expect(AppNotifications.getCollection().length).toBe(2);

      AppNotifications.addNotification({
        type: 'test',
        message: 'this is a test notification'
      });

      expect(AppNotifications.getCollection().length).toBe(3);
    });

    it('should should return the notification if the type aready exists', function () {
      expect(AppNotifications.getCollection().length).toBe(2);

      AppNotifications.addNotification({
        type: 'limit',
        message: 'this is a test notification'
      });

      expect(AppNotifications.getCollection().length).toBe(2);
    });
  });

  describe('.removeNotification', function () {
    it('should remove the notification from the collection', function () {
      expect(AppNotifications.getCollection().length).toBe(2);

      AppNotifications.removeNotification(this.model);

      expect(AppNotifications.getCollection().length).toBe(1);
    });
  });
});
