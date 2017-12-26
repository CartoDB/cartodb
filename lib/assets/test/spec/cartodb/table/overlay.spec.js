describe("cdb.admin.overlays.Text", function() {

  var view;

  afterEach(function() {
    view._close();
  });

  beforeEach(function() {

    var defaultStyle = {
      "z-index": 4,
      "box-color": "#000000",
      "box-opacity": .7,
      "box-width": 200
    };

    var defaultOptions = {
      pLeft: "50",
      pTop: "50",
      landscapeDirection: "left",
      portraitDirection:  "top",
      text: "I'm a **text overlay**",
      rendered_text: "I'm a <strong>text overlay</strong>" // Rendered version of the markdown text
    };

    var model = new cdb.admin.models.Overlay({
      type: "text",
      display: true,
      width: 100,
      height: 100,
      device: "desktop",
      x: 0,
      y: 0,
      extra: defaultOptions,
      style: defaultStyle
    });

    view = new cdb.admin.overlays.Text({
      model: model
    });

    view.render();

  });

  it("should remove the overlay when overlay is selected and the backspace key is pressed", function() {

    var remove = false;

    view.model.set({ selected: true }, { silent: true });

    view._onClickEdit(); // simulates click

    view.bind("remove", function() {
      remove = true;
    });

    var event = $.Event('keydown');
    event.keyCode = 8;
    event.target = view.$el.find(".overlay_text");
    $("body").trigger(event); 

    expect(remove).toBeTruthy();
  });

  it("shouldn't remove the overlay when overlay is not selected and the backspace key is pressed", function() {

    var remove = false

    view._onClickEdit(); // simulates click

    view.model.set({ selected: false }, { silent: true });

    view.bind("remove", function() {
      remove = true;
    });

    var event = $.Event('keydown');
    event.keyCode = 8;
    event.target = view.$el.find(".overlay_text");
    $("body").trigger(event); 

    expect(remove).toBeFalsy();
  });

  it("should remove the overlay when the content of the overlay is empty and it is not selected", function() {

    var remove = false

    view.bind("remove", function() {
      remove = true;
    });

    view.model.set("text", "");
    view.model.set("selected", false);

    expect(remove).toBeTruthy();
  });

  it("should remove the overlay when the content of the overlay is empty and it is not selected", function() {

    var remove = false

    view.bind("remove", function() {
      remove = true;
    });

    view.model.set("text", "<br />");
    view.model.set("selected", false);

    expect(remove).toBeTruthy();
  });

  it("should check the emptiness of a text", function() {
    expect(view._isEmptyText("<div><br /></div>")).toBeTruthy();
    expect(view._isEmptyText("<div><br></div>")).toBeTruthy();
    expect(view._isEmptyText("<div></div>")).toBeTruthy();
    expect(view._isEmptyText("")).toBeTruthy();
    expect(view._isEmptyText(" ")).toBeTruthy();
    expect(view._isEmptyText("<br />a")).toBeFalsy();
    expect(view._isEmptyText(" <br />")).toBeTruthy();
    expect(view._isEmptyText("   <div></div>")).toBeTruthy();
  });

});

describe("cdb.admin.models.Overlay", function() {

  var model;

  beforeEach(function() {

    var defaultStyle = {
      "z-index":          5,
      "color":            "#ffffff",
      "text-align":       "left",
      "font-size":        10,
      "font-family-name": "Helvetica",
      "box-color":        "#000000",
      "box-opacity":      .7,
      "box-padding":      5,
      "line-color":       "#000000",
      "line-width":       50,
      "min-zoom": 3,
      "max-zoom": 40
    };

    var defaultOptions = {
      latlng: [20, 2],
      text: "I'm an **annotation overlay**",
      rendered_text: "I'm a <strong>annotation overlay</strong>" 
    };

    model = new cdb.admin.models.Overlay({
      type: "annotation",
      display: true,
      device: "desktop",
      extra: defaultOptions,
      style: defaultStyle
    });

  });

  it("should clone the attributes", function() {
    expect(_.isEqual(model.attributes, model.cloneAttributes())).toEqual(true);
  });

});
