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

  it("shouldn't strip the HTML tags by default", function() {

    var value = "<strong>Rambo</strong>";

    model.set("name", value);

    expect(view.$input.text()).toEqual(value);
    expect(view.$el.find(".value span").html()).toEqual(value);

  });

  it("should strip the HTML tags", function() {

    $("body .field").empty();

    widget = new cdb.admin.EditInPlace({
      observe: "name",
      stripHTML: true,
      model: model,
      el: $("body .field")
    });

    var value = "<strong>Rambo</strong>";

    model.set("name", value);
    expect(widget.$input.text()).toEqual("Rambo");
    expect(widget.$el.find(".value span").html()).toEqual("Rambo");

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
