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

  it("should observe the field selected by the user", function() {
    expect(view._observedField).toEqual("name");
  });

});
