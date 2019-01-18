
describe("common.ui.Notification", function() {

  var notification;
  beforeEach(function() {
    notification = new cdb.ui.common.Notification({
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
    notification = new cdb.ui.common.Notification({
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
