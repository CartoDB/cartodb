var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var Layers = require('../../../../src/geo/map/layers');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var Template = require('../../../../src/core/template');
var LayerSelector = require('../../../../src/geo/ui/layer-selector');

describe('geo/ui/layer-selector (torque)', function() {

  var layerSelector;

  beforeEach(function() {
    // Map needs a WindshaftMap so we're setting up a fake one
    var windshaftMap = jasmine.createSpyObj('windshaftMap', ['bind', 'createInstance', 'reload']);

    var map = new Map(null, {
      windshaftMap: windshaftMap
    });

    var l1 = new TorqueLayer({ layer_name: 'Layer 1' }, { map: map });
    var l2 = new TorqueLayer({ layer_name: 'Layer 2' }, { map: map });
    var l3 = new TorqueLayer({ layer_name: 'Layer 3' }, { map: map });

    map.layers = new Layers([l1, l2, l3]);

    var mapView = new LeafletMapView({
      el: $("<div>"),
      map: map,
      layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
      layerGroupModel: new Backbone.Model()
    });

    layerSelector = new LayerSelector({
      mapView: mapView,
      template: Template.compile('<a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>','underscore'),
      dropdown_template: Template.compile('<ul></ul><div class="tail"><span class="border"></span></div>','underscore')
    });
  });

  it("should render properly", function() {
    layerSelector.render();
    expect(layerSelector.$('a.layers').size()).toBe(1);
    expect(layerSelector.$('a.layer').size()).toBe(3);
    expect(layerSelector.$('a.layer:eq(0)').text()).toBe("Layer 1");
    expect(layerSelector.$('a.layer:eq(1)').text()).toBe("Layer 2");
    expect(layerSelector.$('a.layer:eq(2)').text()).toBe("Layer 3");
    expect(layerSelector.$('div.count').text()).toBe("3");
  });

  it("should render the dropdown correctly", function() {
    layerSelector.render();
    expect(layerSelector.dropdown.$('li').size()).toBe(3);
  });

  it("should store three layers", function() {
    layerSelector.render();
    expect(layerSelector.layers.length).toBe(3);
  });

  it("should open the dropdown when clicks over it", function() {
    layerSelector.render();
    layerSelector.$('a.layers').click();
    expect(layerSelector.dropdown.$el.css('display')).toBe('block');
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
