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
    expect(view.$el.find(".value span").text()).toEqual("hi");
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

  it("should go back to view mode on keyup Esc and not store the value", function() {
    view.config.set("mode", "edit");
    view.$input.val("Rambo");

    var keyup = $.Event('keyup');
    keyup.keyCode = 27; // Esc

    view.$input.trigger(keyup);

    expect(view.config.get("mode")).toEqual("view");

    expect(model.get("name")).toEqual("hi");

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

  it("should update the values when the model is changed", function() {
    model.set("name", "Rambo");
    expect(view.$input.text()).toEqual("Rambo");
    expect(view.$el.find(".value span").text()).toEqual("Rambo");

    model.set("name", "");
    expect(view.$input.text()).toEqual("");
    expect(view.$el.find(".value span").text()).toEqual("empty");
    expect(view.$el.find(".value").hasClass("empty")).toBeTruthy();
  });

  it("should strip the HTML tags", function() {
    model.set("name", "<strong>Rambo</strong>");
    expect(view.$input.text()).toEqual("Rambo");
    expect(view.$el.find(".value span").text()).toEqual("Rambo");
  });

  it("should show an empty message when there's no text", function() {
    view.$input.val("");

    var keyup = $.Event('keyup');
    keyup.keyCode = 13; // Enter

    view.$input.trigger(keyup);

    expect(model.get("name")).toEqual("");
    expect(view.$el.find(".value span").text()).toEqual("empty");
  });


});
