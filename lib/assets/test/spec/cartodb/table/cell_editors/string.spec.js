
describe("String editor dialog", function() {
  describe("Its editable", function() {
    var dialog;
    beforeEach(function() {
      dialog = new cdb.admin.EditStringDialog({
        el: $('<div>'),
        initial_value: "jamón",
        readOnly: false
      });
      dialog.ok = function() {};
      dialog.cancel = function() {};
      dialog.hide = function() {};
      spyOn(dialog, 'ok');
      spyOn(dialog, 'cancel');
      spyOn(dialog, 'hide');
    });

    it("string dialog should work when change the text", function() {
      dialog.open();
      dialog.$el.find("textarea").val("jam");
      dialog.$el.find("a.ok").click();
      expect(dialog.hide).toHaveBeenCalled();
      expect(dialog.ok).toHaveBeenCalled();
    });

  })
  describe("Its not editable", function() {
    var dialog;
    beforeEach(function() {
      dialog = new cdb.admin.EditStringDialog({
        el: $('<div>'),
        initial_value: "jamón",
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
