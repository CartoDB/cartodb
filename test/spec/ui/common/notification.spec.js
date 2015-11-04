var $ = require('jquery');
var Notification = require('cdb/ui/common/notification');

describe('ui/common/notification', function() {

  var notification;
  beforeEach(function() {
    notification = new Notification({
        el: $('<div>'),
        template: 'template'
    });
    //spyOn(dialog, 'cancel');
  });

  it("open should show the element", function(done) {
    expect(notification.$el.css('display')).toEqual('none');
    notification.open();
    setTimeout(function () {
      expect(notification.$el.css('display')).toEqual('block');
      done();
    }, 500);
  });

  it("should be closed on timeout", function(done) {
    notification = new Notification({
      el: $('<div>'),
      timeout: 250,
      template: 'template'
    });
    notification.open();

    setTimeout(function () {
      expect(notification.$el.css('display')).toEqual('none');
      done();
    }, 500);
  });


});
