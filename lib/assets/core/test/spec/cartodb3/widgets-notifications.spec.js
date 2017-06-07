var widgetsNotifications = require('../../../javascripts/cartodb3/widgets-notifications');

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
});
