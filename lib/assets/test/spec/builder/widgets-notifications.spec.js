var widgetsNotifications = require('builder/widgets-notifications');
var ADD_NOTIFICATION_ID = 'add-notification';

describe('widget-notifications', function () {
  describe('._showErrorNotification', function () {
    it('should do nothing if error is an abort', function () {
      spyOn(widgetsNotifications, '_addOrUpdateNotification');
      var error = {
        status: 0,
        statusText: 'abort'
      };

      widgetsNotifications._showErrorNotification(null, error);

      expect(widgetsNotifications._addOrUpdateNotification).not.toHaveBeenCalled();
    });
  });

  describe('._showAddNotification', function () {
    it('should launch a notification with "add" message', function () {
      spyOn(widgetsNotifications, '_addOrUpdateNotification');

      widgetsNotifications._showAddNotification({ cid: '1234' });

      expect(widgetsNotifications._addOrUpdateNotification).toHaveBeenCalledWith(ADD_NOTIFICATION_ID, jasmine.objectContaining({
        info: _t('notifications.widgets.add_pluralize')
      }));
    });
  });

  describe('._showReplaceNotification', function () {
    it('should launch a notification with "replace" message', function () {
      spyOn(widgetsNotifications, '_addOrUpdateNotification');

      widgetsNotifications._showReplaceNotification({ cid: '1234' });

      expect(widgetsNotifications._addOrUpdateNotification).toHaveBeenCalledWith(ADD_NOTIFICATION_ID, jasmine.objectContaining({
        info: _t('notifications.widgets.replace_pluralize')
      }));
    });
  });
});
