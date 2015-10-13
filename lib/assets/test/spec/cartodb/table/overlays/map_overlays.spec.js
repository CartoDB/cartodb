
describe("cdb.admin.MapOverlays", function() {
  
  beforeEach(function() {
    this.vis = new cdb.admin.Visualization();
    this.overlays = new cdb.admin.Overlays();
    this.overlays.push(new cdb.admin.models.Overlay({
      type: "text",
      device: "screen",
      x: 0,
      y: 0,
      extra: {
        text: 'test'
      },
      style: {
        'box-color': '#ffffff',
        "z-index": 9
      }
    }));

    this.overlays.push(new cdb.admin.models.Overlay({
      type: "zoom",
      device: "screen",
      style: {
        "z-index": 2
      }
    }));

    this.vis.overlays = this.overlays;
    this.mapView = new cdb.core.View();
    this.canvas  = new cdb.core.Model({ mode: "desktop" });

    this.view = new cdb.admin.MapOverlays({
      vis: this.vis,
      canvas: this.canvas,
      mapView: this.mapView,
      master_vis: this.vis
    });

  });

  it("should duplicate an overlay", function() {
    var saved = false;

    cdb.admin.models.Overlay.prototype.save = function() {
      saved = true;
    };

    var overlay = this.vis.overlays.at(0);
    var overlaysCount = this.vis.overlays.length;

    this.view._duplicate(overlay);

    expect(this.vis.overlays.length).toBe(overlaysCount + 1);
    expect(saved).toBe(true);
  });

  it("should store the duplicated overlay for future copy", function() {
    var overlay = this.overlays.at(0);
    this.view._bindOverlay(overlay);
    expect(this.view._copiedOverlay).toEqual(undefined);

    overlay.trigger('duplicate', overlay);

    expect(this.view.editing).toBeDefined();
    expect(this.view._copiedOverlay).toBeDefined();
  });

  it ('should render overlays', function() {

    cdb.admin.models.Overlay.prototype.save = function() {
      saved = true;
    };

    this.vis.overlays.createOverlayByType('zoom');
    this.vis.overlays.createOverlayByType('search');

    expect(this.mapView.$('.cartodb-zoom').length).toEqual(1);
    expect(this.mapView.$('.cartodb-searchbox').length).toEqual(1);
    expect(this.vis.overlays.size()).toEqual(4);

    this.vis.overlays.reset([{
      type: 'zoom',
      order: 6,
      display: true,
      template: '',
      x: 20,
      y: 20
    }]);

    expect(this.mapView.$('.cartodb-zoom').length).toEqual(1);
    expect(this.mapView.$('.cartodb-searchbox').length).toEqual(0);

    expect(this.vis.overlays.size()).toEqual(1);

  });


});
