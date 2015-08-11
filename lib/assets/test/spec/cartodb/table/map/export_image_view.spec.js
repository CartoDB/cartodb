describe("cdb.admin.ExportImageView", function() {
  beforeEach(function() {

    this.map = new cdb.geo.Map();

    this.container = $('<div>').css({ width: '200px', height: '200px' });

    this.mapView = new cdb.geo.GoogleMapsMapView({
      el: this.container,
      map: this.map
    });

    this.pixelToLatLon = sinon.stub(this.mapView, "pixelToLatLon");
    this.pixelToLatLon.returns([10, 20]);

    this.fakeSpy = jasmine.createSpyObj('cdb', ['size', 'getUrl', 'zoom', 'center']);
    spyOn(cdb, 'Image').and.returnValue(this.fakeSpy);
    this.fakeSpy.center.and.returnValue(this.fakeSpy);
    this.fakeSpy.zoom.and.returnValue(this.fakeSpy);
    this.fakeSpy.size.and.returnValue(this.fakeSpy);
    this.fakeSpy.getUrl.and.returnValue(this.fakeSpy);

    this.vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table",
      permission:       {
        owner:  { username: 'staging20', avatar_url: 'http://test.com', id: 2 }
      }
    });

    this.header = new cdb.admin.models.Overlay({
      type: "header",
      display: true,
      show_title: true,
      show_description: true,
      title: "Map title",
      description: "Map description"
    });

    this.view = new cdb.admin.ExportImageView({
      vizjson: 'vizjson_url',
      mapView: this.mapView,
      vis:     this.vis,
      header:  this.header,
      map:     this.map,
      width:    500,
      height:   400
    });

    this.view.render();

  });

  afterEach(function() {
    this.view.clean();
  })

  it("should render", function() {
    expect(this.view.$(".ExportHelper--header").length).toBe(1);
    expect(this.view.$(".ExportHelper--north").length).toBe(1);
    expect(this.view.$(".ExportHelper--south").length).toBe(1);
    expect(this.view.$(".ExportHelper--west").length).toBe(1);
    expect(this.view.$(".ExportHelper--east").length).toBe(1);
    expect(this.view.$(".js-ok").length).toBe(1);
    expect(this.view.$(".ExportImageView--help").text()).toBe("Adjust zoom level and canvas size to fit the area you want to export.");
    expect(this.view.$(".js-title").text()).toBe("Map title");
    expect(this.view.$(".js-description").text()).toBe("Map description");
  });

  it("should enable the resizable", function() {
    expect(this.view.$(".CanvasExport").hasClass("ui-resizable")).toBe(true);
  });

  it("should set the default dimensions in the custom model", function() {
    expect(this.view.model.get("x")).toBe(cdb.admin.ExportImageView.prototype.defaults.top);
    expect(this.view.model.get("y")).toBe(cdb.admin.ExportImageView.prototype.defaults.left);
    expect(this.view.model.get("width")).toBe(500 - 90);
    expect(this.view.model.get("height")).toBe(400 - 130);
  });

  it("should change the helpers dimensions when the stored dimesions are changed", function() {
    this.view.model.set({ x: 50, y: 50, width: 200, height: 200 });

    expect(this.view.$(".js-helper-north").css("top")).toBe("0px");
    expect(this.view.$(".js-helper-north").width()).toBe(50 + 200 + 1);
    expect(this.view.$(".js-helper-north").height()).toBe(50 + 1);

    expect(this.view.$(".js-helper-west").css("left")).toBe("0px");
    expect(this.view.$(".js-helper-west").css("top")).toBe("51px");
    expect(this.view.$(".js-helper-west").width()).toBe(50 + 1);
    expect(this.view.$(".js-helper-west").height()).toBe(200);

    expect(this.view.$(".js-helper-south").css("left")).toBe("0px");
    expect(this.view.$(".js-helper-south").css("top")).toBe("251px");
    expect(this.view.$(".js-helper-south").width()).toBe(this.view.options.mapView.$el.width());
    expect(this.view.$(".js-helper-south").height()).toBe(this.view.options.mapView.$el.height() - 200 + 50);

    expect(this.view.$(".js-helper-east").css("left")).toBe("251px");
    expect(this.view.$(".js-helper-east").css("top")).toBe("0px");
    expect(this.view.$(".js-helper-east").width()).toBe(this.view.options.mapView.$el.width() - 200);
    expect(this.view.$(".js-helper-east").height()).toBe(50 + 200 + 1);
  });

  it("should attempt to generate an image with the right dimensions", function() {
    this.view.$(".js-ok").click();

    expect(this.fakeSpy.size.calls.argsFor(0)[0]).toEqual(500 - 90);
    expect(this.fakeSpy.size.calls.argsFor(0)[1]).toEqual(400 - 130);
    expect(this.fakeSpy.zoom.calls.argsFor(0)[0]).toEqual(this.map.get("zoom"));
  });

  it("should update the title and description", function() {
    this.vis.set({ name: "New map title", description: "New map description" });
    expect(this.view.$(".js-title").text()).toBe("New map title");
    expect(this.view.$(".js-description").text()).toBe("New map description");
  });

});
