var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var Template = require('../../../../src/core/template');
var LayerSelector = require('../../../../src/geo/ui/layer-selector');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var LeafletLayerViewFactory = require('../../../../src/geo/leaflet/leaflet-layer-view-factory');

describe('geo/ui/layer-selector', function () {
  var layerSelector, layer1, layer2;

  beforeEach(function() {
    // Map needs a WindshaftMap so we're setting up a fake one
    var windshaftMap = jasmine.createSpyObj('windshaftMap', ['bind', 'createInstance', 'reload']);

    var map2 = new Map(null, {
      windshaftMap: windshaftMap
    });

    layer1 = new CartoDBLayer({ options: { layer_name: 'Layer 1' } }, { map: map2 });
    layer2 = new CartoDBLayer({ options: { layer_name: 'Layer 2' } }, { map: map2 });

    map2.layers.reset([layer1, layer2]);

    var mapView2 = new LeafletMapView({
      el: $("<div>"),
      map: map2,
      layerViewFactory: new LeafletLayerViewFactory(),
      layerGroupModel: new Backbone.Model({ type: 'layergroup' })
    });

    layerSelector = new LayerSelector({
      mapView: mapView2,
      template: Template.compile('<a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>','underscore'),
      dropdown_template: Template.compile('<ul></ul><div class="tail"><span class="border"></span></div>','underscore')
    });
  });

  it("should render properly", function() {
    layerSelector.render();
    expect(layerSelector.$('a.layers').size()).toBe(1);
    expect(layerSelector.$('a.layer').size()).toBe(2);
    expect(layerSelector.$('a.layer:eq(0)').text()).toBe("Layer 1");
    expect(layerSelector.$('a.layer:eq(1)').text()).toBe("Layer 2");
    expect(layerSelector.$('div.count').text()).toBe("2");
  });

  it("should store two layers", function() {
    layerSelector.render();
    expect(layerSelector.layers.length).toBe(2);
  });

  it("should hide the layer when the switch button is clicked", function() {
    layerSelector.render();

    // Al layers are visible
    expect(layer1.isVisible()).toBeTruthy();
    expect(layer2.isVisible()).toBeTruthy();
    expect(layerSelector.$('div.count').text()).toBe("2");

    // Hide the first layer
    var switcher = $(layerSelector.$('li')[0]);
    switcher.find(".switch").click();

    // Layer1 is hidden
    expect(layer1.isVisible()).toBeFalsy();
    expect(layer2.isVisible()).toBeTruthy();
    expect(layerSelector.$('div.count').text()).toBe("1");
  });

  it("should change the select status when the switch button is clicked and trigger and event", function() {
    layerSelector.render();

    for(var key in layerSelector._subviews) break;
    var view = layerSelector._subviews[key];

    view.$el.find(".switch").click();
    expect(view.model.get("visible")).toBeFalsy();

    view.$el.find(".switch").click();
    expect(view.model.get("visible")).toBeTruthy();
  });

  it("should trigger a switchChanged event when the switch button is clicked", function() {
    layerSelector.render();
    for(var key in layerSelector._subviews) break;
    var view = layerSelector._subviews[key];
    spyOn(view, 'trigger');
    view.$el.find(".switch").click();
    expect(view.trigger).toHaveBeenCalledWith('switchChanged');
  });

  it("should toggle the enabled/disabled classes when the switch button is clicked", function() {
    layerSelector.render();
    for(var key in layerSelector._subviews) break;
    var view = layerSelector._subviews[key];

    view.$el.find(".switch").click();
    expect(view.$el.find(".switch").hasClass("enabled")).toBeFalsy();
    expect(view.$el.find(".switch").hasClass("disabled")).toBeTruthy();
  });
});
