
describe("String editor dialog", function() {

  var dialog;
  beforeEach(function() {
    dialog = new cdb.admin.EditStringDialog({
      el: $('<div>'),
      initial_value: "jamón"
    });
    dialog.ok = function() {};
    dialog.cancel = function() {};
    dialog.hide = function() {};
    spyOn(dialog, 'ok');
    spyOn(dialog, 'cancel');
    spyOn(dialog, 'hide');
  });

  it("string dialog should parse correctly the value", function() {
    dialog.open();
    expect(dialog.options.initial_value).toEqual("jamón");
  });

  it("string dialog should work when change the text", function() {
    dialog.open();
    dialog.$el.find("textarea").val("jam");
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).toHaveBeenCalled();
    expect(dialog.ok).toHaveBeenCalled();
  });
});