describe('api.layers', function() {

  
  describe('loadLayer', function() {
    var map;
    beforeEach(function() {
      map = L.map($('<div>')[0]).setView([0, 0], 3);
    });

    it("should fecth layer when user and pass are specified", function() {
      spyOn($, 'getJSON');
      cartodb.createLayer(map, {
        user: 'development',
        table: 'clubbing',
        host: 'localhost.lan:3000',
        protocol: 'http'
      });
      expect($.getJSON).toHaveBeenCalled();
    });

    it("should fecth layer when a url is specified", function() {
      spyOn($, 'getJSON');
      cartodb.createLayer(map, 'http://test.com/layer.json');
      expect($.getJSON).toHaveBeenCalled();
    });

    it("should not fecth layer when kind and options are specified", function() {
      spyOn($, 'getJSON');
      cartodb.createLayer(map, { kind: 'plain', options: {} });
      expect($.getJSON).not.toHaveBeenCalled();
    });

    it("should create a layer", function() {
      var layer;
      runs(function() {
        cartodb.createLayer(map, { kind: 'plain', options: {} }, function(l) {
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        expect(layer).not.toEqual(undefined);
      });
    });

    it("should manage errors", function() {
      var s = sinon.spy();
      runs(function() {
        cartodb.createLayer(map, { options: {} }).on('error', s);
      });
      waits(10);
      runs(function() {
        expect(s.called).toEqual(true);
      });
    });

    it("should call callback if the last argument is a function", function() {
      var layer;
      var s = sinon.spy();
      var s2 = sinon.spy();
      runs(function() {
        cartodb.createLayer(map, { kind: 'plain', options: {} }, s);
        cartodb.createLayer(map, layer={ kind: 'plain', options: {} }, { rambo: 'thebest'} ,s2);
      });
      waits(10);
      runs(function() {
        expect(s.called).toEqual(true);
        expect(layer.rambo).toEqual('thebest');
        expect(s2.called).toEqual(true);
      });

    });

  });

});
