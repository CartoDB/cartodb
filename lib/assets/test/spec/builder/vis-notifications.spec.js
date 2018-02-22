var Backbone = require('backbone');
var VisNotifications = require('builder/vis-notifications');
var Notifier = require('builder/components/notifier/notifier');

describe('VisNotifications.track', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();
    this.notification = new Backbone.Model();
    spyOn(Notifier, 'addNotification').and.callThrough();
    spyOn(Notifier, 'removeNotification').and.callThrough();
  });

  describe('if vis has errors', function () {
    it('should display a notification', function () {
      this.visModel.set('error', 'whatever');
      VisNotifications.track(this.visModel);
      expect(Notifier.addNotification).toHaveBeenCalledWith({
        id: 'visNotification',
        status: 'error',
        info: "<span class='CDB-Text is-semibold u-errorTextColor'>notifications.vis.failed.title</span>&nbsp;notifications.vis.failed.body",
        closable: false
      });
    });
  });

  describe('if error attribute changes', function () {
    beforeEach(function () {
      VisNotifications.track(this.visModel);
    });

    it("should display a notification if there's an error", function () {
      this.visModel.set('error', 'whatever');
      expect(Notifier.addNotification).toHaveBeenCalledWith({
        id: 'visNotification',
        status: 'error',
        info: "<span class='CDB-Text is-semibold u-errorTextColor'>notifications.vis.failed.title</span>&nbsp;notifications.vis.failed.body",
        closable: false
      });
    });

    it('should hide the notification when the error is removed', function () {
      this.visModel.set('error', 'whatever');
      this.visModel.unset('error');
      expect(Notifier.removeNotification).toHaveBeenCalledWith('visNotification');
    });
  });
});
