
describe("Boolean editor dialog", function() {

  var dialog;
  beforeEach(function() {
    dialog = new cdb.admin.EditBooleanDialog({
      el: $('<div>'),
      initial_value: null
    });
    dialog.ok = function() {};
    dialog.cancel = function() {};
    dialog.hide = function() {};
    spyOn(dialog, 'ok');
    spyOn(dialog, 'cancel');
    spyOn(dialog, 'hide');
  });

  it("boolean dialog should parse correctly the value", function() {
    dialog.open();
    expect(dialog.model.get("value")).toEqual(null);
  });

  it("boolean dialog should work when change the option", function() {
    dialog.open();
    dialog.$el.find("nav a:eq(0)").click();
    expect(dialog.model.get("value")).toEqual(true);
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).toHaveBeenCalled();
    expect(dialog.ok).toHaveBeenCalled();
  });
});