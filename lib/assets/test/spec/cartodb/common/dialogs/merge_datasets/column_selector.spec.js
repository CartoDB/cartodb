describe('cdb.admin.ColumnSelectorModel', function() {
  var selector;
  var spy, listener;

  beforeEach(function() {
    var model = new cdb.admin.ColumnSelectorModel({
      name:           "name",
      joinType:       "regular",
      selected:       false,
      switchSelected: true,
      source:         "origin"
    });

    selector = new cdb.admin.ColumnSelector({
      model: model
    });

    listener = {
      listen: function() {}
    };

    spy = spyOn(listener, "listen");
  });

  it("should trigger an event when the user clicks in a radiobutton", function() {
    selector.render();

    selector.bind("keyColumn", listener.listen);

    selector.$el.find(".radiobutton").trigger("click");

    expect(spy).toHaveBeenCalled();
  });

  it("should allow to click in the radio button", function() {
    selector.render();

    selector.$el.find(".radiobutton").trigger("click");
    expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();
  });

  it("should allow to select the radio button", function() {
    selector.render();

    selector.model.set("selected", true);
    expect(selector.$el.find(".radiobutton").hasClass("selected")).toBeTruthy();
  });

  it("should allow to enable/disable the switch", function() {
    selector.render();

    selector.model.set("switchSelected", true);
    expect(selector.$el.find(".switch").hasClass("enabled")).toBeTruthy();
    expect(selector.$el.find(".switch").hasClass("disabled")).toBeFalsy();

    selector.model.set("switchSelected", false);
    expect(selector.$el.find(".switch").hasClass("enabled")).toBeFalsy();
    expect(selector.$el.find(".switch").hasClass("disabled")).toBeTruthy();
  });

  it("should allow to enable/disable the radio button", function() {
    selector.render();

    selector.model.set("enableRadio", true);
    expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeFalsy();

    selector.model.set("enableRadio", false);
    expect(selector.$el.find(".radiobutton").hasClass("disabled")).toBeTruthy();
  });

  it("should allow to show/hide the radio button", function(done) {
    selector.render();
    selector.model.set("showRadio", false);


    setTimeout(function() {
      expect(selector.$el.find(".radiobutton").hasClass("hidden_radio")).toBeTruthy();
      selector.model.set("showRadio", true);
      setTimeout(function() {
        expect(selector.$el.find(".radiobutton").hasClass("hidden_radio")).toBeFalsy();
        done();
      }, 800);
    }, 800);
  });

  it("should allow to show/hide the switch button", function() {
    selector.render();

    selector.model.set("showSwitch", true);
    expect(selector.$el.find(".switch").hasClass("hidden")).toBeFalsy();

    selector.model.set("showSwitch", false);
    expect(selector.$el.find(".switch").hasClass("hidden")).toBeTruthy();
  });
});
