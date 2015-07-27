describe("OverlayPropertiesBar", function() {

  var view;

  beforeEach(function() {

    var form_data = [{
      name: 'Text Align',
      form: {
        'text-align':      { type: 'text_align', value: 'left' },
      }
    }, {
      name: 'Text Style',
      form: {
        'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2 },
        'color':      { type: 'color', value: '#FFF', extra: { picker_horizontal_position: "right", picker_vertical_position: "down" }},
      }}];

      var vis = new cdb.vis.Vis({});

      var overlays = new Backbone.Collection([
        new cdb.core.Model({
        device: "screen",
        type: "text",
        style: {
          "z-index": 9
        }
      }),
      new cdb.core.Model({
        type: "text",
        device: "screen",
        style: {
          "z-index": 2
        }
      })
      ]);

      var model = new cdb.core.Model({
        style: {
          "z-index": 2
        }
      });

      var canvas = new cdb.core.Model({ mode: "screen" });

      view = new cdb.admin.OverlayPropertiesBar({
        model: model,
        canvas: canvas,
        overlays: overlays,
        vis: vis,
        form_data: form_data
      });

  });

  it("should render the bar fields", function() {
    view.render();
    expect(view.$(".field").length).toEqual(4);
  });

  it("should render the actions", function() {
    view.render();
    expect(view.actions).toBeDefined();
    expect(view.$("li.actions").length).toEqual(1);
    expect(view.$("li.actions a.btn").length).toEqual(4);
  });

  it("should send to back", function() {
    view.render();
    view.$(".btn-zIndexInc").click();
    expect(view.model.get("style")["z-index"]).toBe(10);
  });

  it("should send to front", function() {
    view.render();
    view.$(".btn-zIndexDec").click();
    expect(view.model.get("style")["z-index"]).toBe(1);
  });


});
