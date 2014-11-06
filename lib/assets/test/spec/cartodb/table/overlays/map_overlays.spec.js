
describe("cdb.admin.MapOverlays", function() {
  
  var view, vis, mapView;
  beforeEach(function() {
    vis = new cdb.admin.Visualization();
    vis.enableOverlays();
    view = new cdb.admin.MapOverlays({ 
      vis: vis,
      mapView: (mapView = new cdb.core.View())
    });
  });

  it ('should render overlays', function() {
    vis.overlays.createOverlayByType('zoom');
    vis.overlays.createOverlayByType('search');

    expect(mapView.$('.cartodb-zoom').length).toEqual(1);
    expect(mapView.$('.cartodb-searchbox').length).toEqual(1);

    vis.overlays.reset([{
      type: 'zoom',
      order: 6,
      display: true,
      template: '',
      x: 20,
      y: 20
    }]);

    expect(mapView.$('.cartodb-zoom').length).toEqual(1);
    expect(mapView.$('.cartodb-searchbox').length).toEqual(0);

    expect(vis.overlays.size()).toEqual(1);

  });


});
