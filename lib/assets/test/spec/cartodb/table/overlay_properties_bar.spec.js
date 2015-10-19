describe("OverlayPropertiesBar", function() {

  beforeEach(function() {

    var form_data = [{
      name: 'Text Align',
      form: {
        'text-align': { type: 'text_align', value: 'left' }
      }
    }, {
      name: 'Text Style',
      form: {
        'font-size':  { type: 'simple_number', value: 12, min: 5, max: 50, inc: 2 },
        'color':      { type: 'color', value: '#FFF', extra: { picker_horizontal_position: "right", picker_vertical_position: "down" }}
      }}];

      var vis = new cdb.vis.Vis({});


      this.overlays = new cdb.admin.Overlays();

      this.overlays.push(new cdb.admin.models.Overlay({
        type: "text",
        device: "screen",
        x: 0,
        y: 0,
        style: {
          "z-index": 9
        }
      }));

      this.overlays.push(new cdb.admin.models.Overlay({
        type: "text",
        device: "screen",
        style: {
          "z-index": 2
        }
      }));

      var model = new cdb.core.Model({
        style: {
          "z-index": 2
        }
      });

      var canvas = new cdb.core.Model({ mode: "screen" });

      this.view = new cdb.admin.OverlayPropertiesBar({
        model: model,
        canvas: canvas,
        overlays: this.overlays,
        vis: vis,
        form_data: form_data
      });

  });

  it("should render the bar fields", function() {
    this.view.render();
    expect(this.view.$(".field").length).toEqual(4);
  });

  it("should render the actions", function() {
    this.view.render();
    expect(this.view.actions).toBeDefined();
    expect(this.view.$("li.actions").length).toEqual(1);
    expect(this.view.$("li.actions a.btn").length).toEqual(4);
  });

  it("should send to back", function() {
    this.view.render();
    this.view.$(".btn-zIndexInc").click();
    expect(this.view.model.get("style")["z-index"]).toBe(10);
  });

  it("should send to front", function() {
    this.view.render();
    this.view.$(".btn-zIndexDec").click();
    expect(this.view.model.get("style")["z-index"]).toBe(1);
  });


});
