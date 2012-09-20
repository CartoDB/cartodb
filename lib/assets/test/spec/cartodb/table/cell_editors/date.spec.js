
describe("Date editor dialog", function() {

  var dialog;
  beforeEach(function() {
    dialog = new cdb.admin.EditDateDialog({
      el: $('<div>'),
      initial_value: "2011-07-11T03:00:00+02:00"
    });
    dialog.ok = function() {};
    dialog.cancel = function() {};
    dialog.hide = function() {};
    spyOn(dialog, 'ok');
    spyOn(dialog, 'cancel');
    spyOn(dialog, 'hide');
  });

  it("date dialog should parse correctly the date", function() {
    dialog.open();
    expect(dialog.model.get("year")).toEqual(2011);
    expect(dialog.model.get("month")).toEqual(7);
    expect(dialog.model.get("day")).toEqual(11);
    expect(dialog.model.get("time")).toEqual("03:00:00");
  });

  it("date dialog should render a custom select, two spinners and the input", function() {
    dialog.open();
    expect(dialog.$el.find("input.value").size()).toEqual(2);
    expect(dialog.$el.find(".select2-container").size()).toEqual(1);
    expect(dialog.$el.find("input.time").size()).toEqual(1);
  });

  it("date dialog should work when saves", function() {
    dialog.open();
    dialog.$el.find("input.time").val("01:00:00");
    dialog.$el.find("a.button").click();
    expect(dialog.ok).toHaveBeenCalled();
  });

  it("date dialog shouldn't let you close the editor if the time is not correct", function() {
    dialog.open();
    dialog.$el.find("input.time").val("fail!");
    dialog.$el.find("input.time").keyup();
    dialog.$el.find("a.ok").click();
    expect(dialog.hide).not.toHaveBeenCalled();
  });

});