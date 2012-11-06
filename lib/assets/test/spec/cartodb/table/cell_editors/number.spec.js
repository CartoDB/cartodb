
describe("Number editor dialog", function() {

  var dialog;
  beforeEach(function() {
    dialog = new cdb.admin.EditNumberDialog({
      el: $('<div>'),
      initial_value: "123214234",
      readOnly: false
    });
    dialog.ok = function() {};
    dialog.cancel = function() {};
    dialog.hide = function() {};
    spyOn(dialog, 'ok');
    spyOn(dialog, 'cancel');
    spyOn(dialog, 'hide');
  });

  it("number dialog should work when saves", function() {
    dialog.open();
    dialog.$el.find("textarea").val("010231023");
    dialog.$el.find("a.button").click();
    expect(dialog.ok).toHaveBeenCalled();
  });

  it("number dialog shouldn't let you close the editor if the number is not correct", function() {
    dialog.open();
    dialog.$el.find("textarea").val("fail!");
    dialog.$el.find("textarea").keyup();
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).not.toHaveBeenCalled();
  });

  describe("Its not editable", function() {
    var dialog;
    beforeEach(function() {
      dialog = new cdb.admin.EditNumberDialog({
        el: $('<div>'),
        initial_value: "123214234",
        readOnly: true
      });
      dialog.cancel = function() {};
      dialog.hide = function() {};
      spyOn(dialog, 'cancel');
      spyOn(dialog, 'hide');
    });

    it("should not contain any ok button", function() {
      expect(dialog.$el.find("a.ok").length).toBeFalsy();
    })

    it("textarea should not be editable", function() {
      expect(dialog.$el.find("textarea").attr('disabled')).toBeTruthy();
    });

    it("textarea should close when button clicked", function() {
      dialog.open();
      dialog.$el.find(".cancel").click();
      expect(dialog.cancel).toHaveBeenCalled();
    });

  })

});
