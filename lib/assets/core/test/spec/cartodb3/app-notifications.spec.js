var AppNotificatios = require('../../../javascripts/cartodb3/app-notifications');
var ConfigModel = require('../../../javascripts/cartodb3/data/config-model');

describe('app-notifications', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/rick'
    });

    AppNotificatios.init();

    this.model = AppNotificatios.addNotification({
      type: 'limit',
      message: 'this is a limit notification'
    });

    AppNotificatios.addNotification({
      type: 'widget',
      message: 'this is a widget notification'
    });
  });

  afterEach(function () {
    AppNotificatios.off();
  });

  describe('.getByType', function () {
    it('should return the correct model', function () {
      var notification = AppNotificatios.getByType('limit');
      expect(notification).toBe(this.model);
    });
  });

  describe('.getCollection', function () {
    it('should return the notifications collection', function () {
      var collection = AppNotificatios.getCollection();

      expect(collection.length).toEqual(2);
      expect(collection.models[0]).toBe(this.model);
    });
  });

  describe('.getNotification', function () {
    it('should return the correct notification with the model id', function () {
      var notification = AppNotificatios.getNotification(this.model.cid);
      expect(notification).toBe(this.model);
    });

    it('should return the correct notification with the model', function () {
      var notification = AppNotificatios.getNotification(this.model);
      expect(notification).toBe(this.model);
    });
  });

  describe('.addNotification', function () {
    it('should should add the notification to the collection', function () {
      expect(AppNotificatios.getCollection().length).toBe(2);

      AppNotificatios.addNotification({
        type: 'test',
        message: 'this is a test notification'
      });

      expect(AppNotificatios.getCollection().length).toBe(3);
    });

    it('should should return the notification if the type aready exists', function () {
      expect(AppNotificatios.getCollection().length).toBe(2);

      AppNotificatios.addNotification({
        type: 'limit',
        message: 'this is a test notification'
      });

      expect(AppNotificatios.getCollection().length).toBe(2);
    });
  });

  describe('.removeNotification', function () {
    it('should remove the notification from the collection', function () {
      expect(AppNotificatios.getCollection().length).toBe(2);

      AppNotificatios.removeNotification(this.model);

      expect(AppNotificatios.getCollection().length).toBe(1);
    });
  });
});
