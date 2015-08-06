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

    fakeSpy = jasmine.createSpyObj('cdb', ['size', 'getUrl', 'zoom', 'center']);
    spyOn(cdb, "Image").and.returnValue(fakeSpy);
    fakeSpy.center.and.returnValue(fakeSpy);
    fakeSpy.zoom.and.returnValue(fakeSpy);
    fakeSpy.size.and.returnValue(fakeSpy);
    fakeSpy.getUrl.and.returnValue(fakeSpy);

    this.view = new cdb.admin.ExportImageView({
      vizjson: "vizjson_url",
      mapView: this.mapView,
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
    expect(this.view.$(".ExportHelper").length).toBe(4);
    expect(this.view.$(".js-ok").length).toBe(1);
    expect(this.view.$(".ExportImageView--help").text()).toBe("Adjust zoom level and canvas size to fit the area you want to export.");
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

    expect(fakeSpy.size.calls.argsFor(0)[0]).toEqual(500 - 90);
    expect(fakeSpy.size.calls.argsFor(0)[1]).toEqual(400 - 130);
    expect(fakeSpy.zoom.calls.argsFor(0)[0]).toEqual(this.map.get("zoom"));
  });

  it("should trigger a finish event", function() {
    var finish = false;

    this.view.bind("finish", function() {
      finish = true;
    });

    this.view.$(".js-ok").click();
    fakeSpy.getUrl.calls.argsFor(0)[0]();

    expect(finish).toBe(true);
  });
});
