describe('api.layers', function() {

  
  describe('loadLayer', function() {
    var map;
    beforeEach(function() {
      map = L.map($('<div>')[0]).setView([0, 0], 3);
    });

    it("should fecth layer when user and pass are specified", function() {
      spyOn($, 'getJSON');
      cartodb.loadLayer(map, {
        user: 'development',
        table: 'clubbing',
        host: 'localhost.lan:3000',
        protocol: 'http'
      });
      expect($.getJSON).toHaveBeenCalled();
    });

    it("should fecth layer when a url is specified", function() {
      spyOn($, 'getJSON');
      cartodb.loadLayer(map, 'http://test.com/layer.json');
      expect($.getJSON).toHaveBeenCalled();
    });

    it("should not fecth layer when kind and options are specified", function() {
      spyOn($, 'getJSON');
      cartodb.loadLayer(map, { kind: 'plain', options: {} });
      expect($.getJSON).not.toHaveBeenCalled();
    });

    it("should create a layer in the map", function() {
      cartodb.loadLayer(map, { kind: 'plain', options: {} });
      expect(map.viz.mapView.map.layers.size()).toEqual(1);
    });

    it("should call callback if the last argument is a function", function() {
      var layer;
      var s = sinon.spy();
      cartodb.loadLayer(map, { kind: 'plain', options: {} }, s);
      expect(s.called).toEqual(true);
      var s2 = sinon.spy();
      cartodb.loadLayer(map, layer={ kind: 'plain', options: {} }, { rambo: 'thebest'} ,s2);
      expect(layer.rambo).toEqual('thebest');
      expect(s2.called).toEqual(true);
    });

  });

});
