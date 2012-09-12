
//=================================================
//
//
//
//  THOSE TEST ARE **REALLY** IMPORTANT SO IF SOME 
//  OF THEM IS BROKEN, PLEASE, TAKE CARE OF IT
//
//  when the user changes base layer (and maybe maps provider)
//  lot of stuff need to be done:
//
//   - change map provider
//   - remove the old base layer
//   - set the new base layers
//   - save all the layers to the server
//
//
//
//=================================================
 
describe("baseMapView", function() {

  var model, view, map;
  beforeEach(function() {

    model = new cdb.admin.TileLayer({
      urlTemplate: 'http://test.com'
    });

    map = new cdb.admin.Map({
      provider: 'leaflet'
    });

    // add base map
    map.layers.add(new cdb.admin.TileLayer());

    view = new cdb.admin.BaseMapView({
      el: $('<div>'),
      model: model,
      map: map
    });
  });

  it("should change base layer when click", function() {
    view.render();
    view.$el.trigger('click');
    expect(map.getBaseLayer().get('urlTemplate')).toEqual('http://test.com');
  });

  it("if the map provider is gmaps should switch to leaflet", function() {
    map.set({provider: 'googlemaps'});
    var layer = new cdb.admin.TileLayer();
    map.layers.add(layer);
    spyOn(layer, 'save');
    spyOn(map, 'save');
    view.render();
    view.$el.trigger('click');
    expect(map.getBaseLayer().get('urlTemplate')).toEqual('http://test.com');
    expect(map.get('provider')).toEqual('leaflet');
    // should save all the layers
    expect(layer.save).toHaveBeenCalled();
    expect(layer.get('order')).toEqual(1);
    expect(map.save).toHaveBeenCalled();
  });
});

describe("gmapsbaseview", function() {

  var model, view, map;
  beforeEach(function() {

    model = new cdb.admin.TileLayer({
      urlTemplate: 'http://test.com'
    });

    map = new cdb.admin.Map({
      provider: 'leaflet'
    });

    // add base map
    map.layers.add(new cdb.admin.GMapsBaseLayer());

    view = new cdb.admin.GMapsBaseView({
      el: $('<div>'),
      model: map
    });
  });

  it("if the map provider is leaglet should switch to gmaps and change baselayer", function() {
    var layer = new cdb.admin.TileLayer();
    map.layers.add(layer);
    spyOn(layer, 'save');
    spyOn(map, 'save');
    view.render();
    view.$el.trigger('click');
    expect(map.getBaseLayer().get('type')).toEqual('GMapsBase');
    expect(map.get('provider')).toEqual('googlemaps');
    // should save all the layers
    expect(layer.save).toHaveBeenCalled();
    expect(map.save).toHaveBeenCalled();
    expect(layer.get('order')).toEqual(1);
  });
});
