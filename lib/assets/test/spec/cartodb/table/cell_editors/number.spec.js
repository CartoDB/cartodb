
describe("Number editor dialog", function() {

  var dialog;
  var resNumber;
  beforeEach(function() {
    resNumber = undefined;
    dialog = new cdb.admin.EditNumberDialog({
      el: $('<div>'),
      initial_value: "123214234",
      readOnly: false,
      res: function(number) {
        resNumber = number;
      }
    });
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
    dialog.$el.find("input.number").val("fail!");
    dialog.$el.find("input.number").keyup();
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).not.toHaveBeenCalled();
  });

  it("number dialog should let you close the editor if there isn't any number", function() {
    dialog.open();
    dialog.$el.find("input.number").val("");
    dialog.$el.find("input.number").keyup();
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).toHaveBeenCalled();
  });

  it("number dialog should save 'null' when there isn't any number", function() {
    dialog.open();
    dialog.$el.find("input.number").val("");
    dialog.$el.find("input.number").keyup();
    dialog.$el.find("a.ok").click();
    expect(resNumber).toEqual(null)
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

    it("input should not be editable", function() {
      expect(dialog.$el.find("input.number").attr('disabled')).toBeTruthy();
    });

    it("input should close when button clicked", function() {
      dialog.open();
      dialog.$el.find(".cancel").click();
      expect(dialog.cancel).toHaveBeenCalled();
    });

  })

});
