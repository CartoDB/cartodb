var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../src/geo/map');
var MapView = require('../../../src/geo/map-view');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var Infowindow = require('../../../src/geo/ui/infowindow');

describe('core/geo/map-view', function() {
  beforeEach(function() {
    this.container = $('<div>').css('height', '200px');

    var windshaftMap = {
      instance: new Backbone.Model()
    };

    this.map = new Map();

    // Map needs a WindshaftMap so we're setting up a fake one
    this.map.windshaftMap = {
      instance: new Backbone.Model()
    };

    this.mapView = new MapView({
      el: this.container,
      map: this.map
    });
  });

  it('should be able to add a infowindow', function() {
    var infow = new Infowindow({mapView: this.mapView, model: new Backbone.Model()});
    this.mapView.addInfowindow(infow);

    expect(this.mapView._subviews[infow.cid]).toBeTruthy()
    expect(this.mapView._subviews[infow.cid] instanceof Infowindow).toBeTruthy()
  });

  it('should be able to retrieve the infowindows', function() {
    var infow = new Infowindow({mapView: this.mapView, model: new Backbone.Model()});
    this.mapView._subviews['irrelevant'] = new Backbone.View();
    this.mapView.addInfowindow(infow);

    var infowindows = this.mapView.getInfoWindows()

    expect(infowindows.length).toEqual(1);
    expect(infowindows[0]).toEqual(infow);
  });

  it('should group CartoDB layers into a single layerView', function () {
    var layer1 = new CartoDBLayer();
    var layer2 = new CartoDBLayer();

    spyOn(this.mapView, 'createLayer').and.callFake(function () {
      return jasmine.createSpyObj('layerView', ['remove']);
    });
    spyOn(this.mapView, '_addLayerToMap');

    // Adding more than one layer
    this.map.addLayer(layer1);
    this.map.addLayer(layer2);

    var layerViewForLayer1 = this.mapView.getLayerByCid(layer1.cid);
    expect(layerViewForLayer1).toBeDefined();
    var layerViewForLayer2 = this.mapView.getLayerByCid(layer2.cid);
    expect(layerViewForLayer2).toBeDefined();
    expect(layerViewForLayer1).toEqual(layerViewForLayer2);

    // Remove one layer
    this.map.layers.remove(layer1);

    layerViewForLayer1 = this.mapView.getLayerByCid(layer1.cid);
    expect(layerViewForLayer1).not.toBeDefined();
    layerViewForLayer2 = this.mapView.getLayerByCid(layer2.cid);
    expect(layerViewForLayer2).toBeDefined();
    // expect(layerViewForLayer2 instanceof LeafletCartoDBLayerGroupView).toBeTruthy();

    this.map.layers.remove(layer2);

    layerViewForLayer2 = this.mapView.getLayerByCid(layer2.cid);
    expect(layerViewForLayer2).not.toBeDefined();
  });
});
