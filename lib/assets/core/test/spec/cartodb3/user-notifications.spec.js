var UserNotifications = require('../../../javascripts/cartodb3/user-notifications');
var ConfigModel = require('../../../javascripts/cartodb3/data/config-model');

describe('user-notifications', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/rick'
    });

    UserNotifications.init({
      configModel: this.configModel
    });

    this.model = UserNotifications.addNotification({
      type: 'limit',
      message: 'this is a limit notification'
    });

    UserNotifications.addNotification({
      type: 'widget',
      message: 'this is a widget notification'
    });
  });

  afterEach(function () {
    UserNotifications.off();
  });

  describe('.getByType', function () {
    it('should return the correct model', function () {
      var notification = UserNotifications.getByType('limit');
      expect(notification).toBe(this.model);
    });
  });

  describe('.getCollection', function () {
    it('should return the notifications collection', function () {
      var collection = UserNotifications.getCollection();

      expect(collection.length).toEqual(2);
      expect(collection.models[0]).toBe(this.model);
    });
  });

  describe('.getNotification', function () {
    it('should return the correct notification with the model id', function () {
      var notification = UserNotifications.getNotification(this.model.cid);
      expect(notification).toBe(this.model);
    });

    it('should return the correct notification with the model', function () {
      var notification = UserNotifications.getNotification(this.model);
      expect(notification).toBe(this.model);
    });
  });

  describe('.addNotification', function () {
    it('should should add the notification to the collection', function () {
      expect(UserNotifications.getCollection().length).toBe(2);

      UserNotifications.addNotification({
        type: 'test',
        message: 'this is a test notification'
      });

      expect(UserNotifications.getCollection().length).toBe(3);
    });

    it('should should return the notification if the type aready exists', function () {
      expect(UserNotifications.getCollection().length).toBe(2);

      UserNotifications.addNotification({
        type: 'limit',
        message: 'this is a test notification'
      });

      expect(UserNotifications.getCollection().length).toBe(2);
    });
  });

  describe('.removeNotification', function () {
    it('should remove the notification from the collection', function () {
      expect(UserNotifications.getCollection().length).toBe(2);

      UserNotifications.removeNotification(this.model);

      expect(UserNotifications.getCollection().length).toBe(1);
    });
  });

  describe('.infobox', function () {
    it('should add the secondAction if it\'s a custom installation', function () {
      // Is saas
      this.configModel.set('cartodb_com_hosted', false);
      expect(UserNotifications.infobox().secondAction).not.toBeUndefined();

      // Is hosted outside carto
      this.configModel.set('cartodb_com_hosted', true);
      expect(UserNotifications.infobox().secondAction).toBeUndefined();
    });
  });
});
