
describe("common.ui.Notification", function() {

  var notification;
  beforeEach(function() {
    notification = new cdb.ui.common.Notification({el: $('<div>')});
    //spyOn(dialog, 'cancel');
  });

  it("open should show the element", function() {
    runs(function () {
      expect(notification.$el.css('display')).toEqual('none');
      notification.open();
    });
    waits(500);
    runs(function () {
      expect(notification.$el.css('display')).toEqual('block');
    });
  });

  it("should be closed on timeout", function() {
    runs(function () {
      notification = new cdb.ui.common.Notification({
        el: $('<div>'),
        timeout: 250
      });
      notification.open();
    });
    waits(500);
    runs(function () {
      expect(notification.$el.css('display')).toEqual('none');
    });
  });


});
