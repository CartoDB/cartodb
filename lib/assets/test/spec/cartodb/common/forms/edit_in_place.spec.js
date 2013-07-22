describe('cdb.admin.EditInPlace', function() {

  var view, model;

  beforeEach(function() {

    model = new cdb.core.Model({
      name: "hi"
    });

    $("body").append('<div class="field" />');

    view = new cdb.admin.EditInPlace({
      observe: "name",
      model: model,
      el: $("body .field")
    });

  });

  afterEach(function() {
    view.clean();
  });

  it("should render the field", function() {
    expect(view.$el.find(".value").text()).toEqual("hi");
  });

  it("should start in view mode", function() {
    expect(view.config.get("mode")).toEqual("view");
  });

  it("should observe the field selected by the user", function() {
    expect(view._observedField).toEqual("name");
  });

  it("should enter the edit mode on click", function() {
    view.$el.find(".value").click();
    expect(view.config.get("mode")).toEqual("edit");
  });

  it("should go back to view mode on blur", function() {
    view.config.set("mode", "edit");
    view.$input.blur();
    expect(view.config.get("mode")).toEqual("view");
  });

  it("should go back to view mode on keyup esc", function() {
    view.config.set("mode", "edit");

    var keyup = $.Event('keyup');
    keyup.keyCode = 27;

    view.$input.trigger(keyup);

    expect(view.config.get("mode")).toEqual("view");

  });

  it("should store the entered text on Enter", function() {
    view.config.set("mode", "edit");
    view.$input.val("Rambo");

    var keyup = $.Event('keyup');
    keyup.keyCode = 13; // Enter

    view.$input.trigger(keyup);

    expect(view.config.get("mode")).toEqual("view");
    expect(model.get("name")).toEqual("Rambo");

  });

});
