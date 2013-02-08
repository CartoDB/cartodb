describe('api.layers', function() {

  describe('loadLayer leaflet', function() {
    loadLayerSpecs(function() {
      return L.map($('<div>')[0]).setView([0, 0], 3);
    });
  });

  describe('loadLayer gmaps', function() {
    loadLayerSpecs(function() {
      return new google.maps.Map($('<div>')[0],{
        zoom: 3,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
    });
  });


  describe('loadLayer unknow', function() {
    it("shoudl return an error for unknow map types", function() {
      var map = {};
      var err = false;
      runs(function() {
        cartodb.createLayer(map, { kind: 'plain', options: {} }, function(l) {
          layer = l;
        }).error(function() {
          err = true;
        });
      })
      waits(10);
      runs(function() {
        expect(err).toEqual(true);
      });
    })
  });

  //
  // shared specs for each map
  //
  function loadLayerSpecs(mapFn) {

    describe("(shared)", function() {
      var map;
      beforeEach(function() {
        map = mapFn();
      });

      it("should fecth layer when user and pass are specified", function() {
        spyOn(cdb.vis.Loader, 'get');
        cartodb.createLayer(map, {
          user: 'development',
          table: 'clubbing',
          host: 'localhost.lan:3000',
          protocol: 'http'
        });
        expect(cdb.vis.Loader.get).toHaveBeenCalled();
      });

      it("should fecth layer when a url is specified", function() {
        spyOn(cdb.vis.Loader, 'get');
        cartodb.createLayer(map, 'http://test.com/layer.json');
        expect(cdb.vis.Loader.get).toHaveBeenCalled();
      });

      it("should not fecth layer when kind and options are specified", function() {
        spyOn(cdb.vis.Loader, 'get');
        cartodb.createLayer(map, { kind: 'plain', options: {} });
        expect(cdb.vis.Loader.get).not.toHaveBeenCalled();
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
          expect(layer.type).toEqual('plain');
        });
      });

      it("should create a layer with type", function() {
        var layer;
        runs(function() {
          cartodb.createLayer(map, { kind: 'cartodb', options: {} }, function(l) {
            layer = l;
          });
        });
        waits(100);
        runs(function() {
          expect(layer.type).toEqual('cartodb');
        });
      });

      it("should create a layer with options", function() {
        var layer;
        runs(function() {
          cartodb.createLayer(map, { kind: 'cartodb', options: {} }, {query: 'select test'}, function(l) {
            layer = l;
          });
        });
        waits(100);
        runs(function() {
          expect(layer.options.query).toEqual('select test');
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
          expect(layer.options.rambo).toEqual('thebest');
          expect(s2.called).toEqual(true);
        });

      });

      it("should load vis.json", function() {
        var layer;
        var s = sinon.spy();
        runs(function() {
          cartodb.createLayer(map, { 
            updated_at: 'jaja',
            layers: [
              null,
              //{kind: 'plain', options: {} }
              {kind: 'cartodb', options: { user_name: 'test', table: 'test', extra_params: { cache_buster: 'cb' }} }
            ]
          }, s).done(function(lyr) {
            layer = lyr;
          });
        });
        waits(10);
        runs(function() {
          expect(s.called).toEqual(true);
          expect(layer.model.attributes.extra_params.updated_at).toEqual('jaja');
          expect(layer.model.attributes.extra_params.cache_buster).toEqual(undefined);
        });
      });

      it("should load vis.json without infowindows", function() {
        var layer;
        var s = sinon.spy();
        runs(function() {
          cartodb.createLayer(map, { 
            updated_at: 'jaja',
            layers: [
              null,
              {kind: 'cartodb', options: { user_name: 'test'}, infowindow: { fields: [], template: '' } }
            ]
          }, s).done(function(lyr) {
            layer = lyr;
          });
        });
        waits(10);
        runs(function() {
          expect(s.called).toEqual(true);
        });
      });
    });

  };

});
