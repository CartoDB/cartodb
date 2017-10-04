var LimitNotifications = require('../../../javascripts/cartodb3/limit-notifications');
var ConfigModel = require('../../../javascripts/cartodb3/data/config-model');

describe('limit-notifications', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/rick'
    });

    LimitNotifications.init({
      configModel: this.configModel
    });

    this.model = LimitNotifications.addNotification({
      type: 'limit',
      message: 'this is a limit notification'
    });

    LimitNotifications.addNotification({
      type: 'widget',
      message: 'this is a widget notification'
    });
  });

  afterEach(function () {
    LimitNotifications.off();
  });

  describe('.getByType', function () {
    it('should return the correct model', function () {
      var notification = LimitNotifications.getByType('limit');
      expect(notification).toBe(this.model);
    });
  });

  describe('.getCollection', function () {
    it('should return the notifications collection', function () {
      var collection = LimitNotifications.getCollection();

      expect(collection.length).toEqual(2);
      expect(collection.models[0]).toBe(this.model);
    });
  });

  describe('.getNotification', function () {
    it('should return the correct notification with the model id', function () {
      var notification = LimitNotifications.getNotification(this.model.cid);
      expect(notification).toBe(this.model);
    });

    it('should return the correct notification with the model', function () {
      var notification = LimitNotifications.getNotification(this.model);
      expect(notification).toBe(this.model);
    });
  });

  describe('.addNotification', function () {
    it('should should add the notification to the collection', function () {
      expect(LimitNotifications.getCollection().length).toBe(2);

      LimitNotifications.addNotification({
        type: 'test',
        message: 'this is a test notification'
      });

      expect(LimitNotifications.getCollection().length).toBe(3);
    });

    it('should should return the notification if the type aready exists', function () {
      expect(LimitNotifications.getCollection().length).toBe(2);

      LimitNotifications.addNotification({
        type: 'limit',
        message: 'this is a test notification'
      });

      expect(LimitNotifications.getCollection().length).toBe(2);
    });
  });

  describe('.removeNotification', function () {
    it('should remove the notification from the collection', function () {
      expect(LimitNotifications.getCollection().length).toBe(2);

      LimitNotifications.removeNotification(this.model);

      expect(LimitNotifications.getCollection().length).toBe(1);
    });
  });

  describe('.infobox', function () {
    it('should add the secondAction if it\'s a custom installation', function () {
      // Is saas
      this.configModel.set('cartodb_com_hosted', false);
      expect(LimitNotifications.infobox().secondAction).not.toBeUndefined();

      // Is hosted outside carto
      this.configModel.set('cartodb_com_hosted', true);
      expect(LimitNotifications.infobox().secondAction).toBeUndefined();
    });
  });
});
