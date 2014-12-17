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
    it("shoudl return an error for unknow map types", function(done) {
      var map = {};
      var err = false;
      cartodb.createLayer(map, { kind: 'plain', options: {} }, function(l) {
        layer = l;
      }).error(function() {
        err = true;
      });

      setTimeout(function() {
        expect(err).toEqual(true);
        done();
      }, 1000);
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
        cartodb.torque = torque;
      });

      afterEach(function() {
        delete cartodb.torque;
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

      it("should create a layer", function(done) {
        var layer;

        cartodb.createLayer(map, { kind: 'plain', options: {} }, function(l) {
          layer = l;
        });
      
        setTimeout(function() {
          expect(layer).not.toEqual(undefined);
          expect(layer.type).toEqual('plain');
          done();
        }, 100);
      });

      it("should create a layer with type", function(done) {
        var layer;

        cartodb.createLayer(map, { kind: 'cartodb', options: { tile_style: 'test', table_name: 'table', user_name: 'test'} }, function(l) {
          layer = l;
        });

        setTimeout(function() {
          expect(layer.type).toEqual('cartodb');
          done();
        }, 100);
      });

      it("should create a layer with options", function(done) {
        var layer;
        cartodb.createLayer(map, { kind: 'cartodb', options: {tile_style: 'test', table_name: 'table', user_name: 'test'} }, {query: 'select test'}, function(l) {
          layer = l;
        });

        setTimeout(function() {
          expect(layer.options.query).toEqual('select test');
          done();
        }, 100);
      });

      it("should use https when https == true", function(done) {
        var layer;

        cartodb.createLayer(map, { kind: 'cartodb', options: {tile_style: 'test', table_name: 'table', user_name: 'test'} }, {https: true}, function(l) {
          layer = l;
        });

        setTimeout(function() {
          expect(layer._host().indexOf('https')).toEqual(0);
          done();
        }, 100);
      });

      it("should not use https when https == false", function(done) {
        var layer;

        cartodb.createLayer(map, { kind: 'cartodb', options: {tile_style: 'test', table_name: 'table', user_name: 'test'} }, {https: false}, function(l) {
          layer = l;
        });
        
        setTimeout(function() {
          expect(layer._host().indexOf('https')).toEqual(-1);
          done();
        }, 100);
      });

      it("should not substitute mapnik tokens", function(done) {
        var layer;

        cartodb.createLayer(map, { kind: 'cartodb', options: {tile_style: 'test', table_name: 'table', user_name: 'test'} }, {query: 'select !bbox!'}, function(l) {
          layer = l
        })

        setTimeout(function() {
          expect(layer.getQuery()).toEqual('select !bbox!');
          done();
        }, 100);
      });

      it("should manage errors", function(done) {
        var s = sinon.spy();
        cartodb.createLayer(map, { options: {} }).on('error', s);

        setTimeout(function() {
          expect(s.called).toEqual(true);
          done();
        }, 10);
      });

      it("should call callback if the last argument is a function", function(done) {
        var layer;
        var s = sinon.spy();
        var s2 = sinon.spy();

        cartodb.createLayer(map, { kind: 'plain', options: {} }, s);
        cartodb.createLayer(map, layer={ kind: 'plain', options: {} }, { rambo: 'thebest'} ,s2);

        setTimeout(function() {
          expect(s.called).toEqual(true);
          expect(layer.options.rambo).toEqual('thebest');
          expect(s2.called).toEqual(true);
          done();
        }, 10);

      });

      it("should load vis.json", function(done) {
        var layer;
        var s = sinon.spy();
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            //{kind: 'plain', options: {} }
            {kind: 'cartodb', options: { tile_style: 'test', user_name: 'test', table_name: 'test', extra_params: { cache_buster: 'cb' }} }
          ]
        }, s).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(s.called).toEqual(true);
          //expect(layer.model.attributes.extra_params.updated_at).toEqual('jaja');
          expect(layer.model.attributes.extra_params.cache_buster).toEqual('cb');
          //expect(layer.model.attributes.extra_params.cache_buster).toEqual(undefined);
          done();
        }, 10);
      });

      it("should load vis.json without infowindows", function(done) {
        var layer;
        var s = sinon.spy();
        
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: { fields: [], template: '' } }
          ]
        }, s).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(s.called).toEqual(true);
          done();
        }, 10);

      });

      it("should load specified layer", function(done) {
        var layer;
        var s = sinon.spy();
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
            {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map{ -torque-frame-count: 10; }#test { marker-width: 10; }'}, infowindow: null }
          ]
        }, { layerIndex: 2 }, s).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(s.called).toEqual(true);
          // check it's a torque layer and not a cartodb one
          expect(layer.model.get('type')).toEqual('torque');
          done();
        }, 500);

      });

      it("should add a torque layer", function(done) {
        var layer;
        var s = sinon.spy();
        
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
            {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}, infowindow: null }
          ]
        }, { layerIndex: 2 }, s).done(function(lyr) {
          layer = lyr;
        }).addTo(map)

        var wait = 500;
        if (!map.getContainer) wait = 2500;

        setTimeout(function() {
          if (map.getContainer) expect($(map.getContainer()).find('.cartodb-timeslider').length).toBe(1)
          if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-timeslider').length).toBe(1)
          done()
        }, wait);
      });

      it("should add cartodb logo with torque layer although it is not defined", function(done) {
        var layer;
        var s = sinon.spy();

        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
            {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map{ -torque-frame-count: 10;}#test { marker-width: 10; }'}, infowindow: null }
          ]
        }, { layerIndex: 2 }, s).done(function(lyr) {
          layer = lyr;
        }).addTo(map)

        var wait = 500;
        if (!map.getContainer) wait = 2500;

        setTimeout(function() {
          expect(layer.options.cartodb_logo).toEqual(undefined);
          if (map.getContainer) expect($(map.getContainer()).find('.cartodb-logo').length).toBe(1)
          if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-logo').length).toBe(1)
          done();
        }, wait);
      });

      it("should create a named map", function(done) {
        var layer;

        cartodb.createLayer(map, {
          type: 'namedmap',
          user_name: 'dev',
          options: {
            named_map: {
              name: 'testing',
              params: {
                color: 'red'
              }
            }
          }
        }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).not.toEqual(undefined);
          expect(layer.toJSON()).toEqual({ color: 'red' });
          done();
        }, 100);

      });

      it("should use access_token", function(done) {
        var layer;

        cartodb.createLayer(map, {
          type: 'namedmap',
          user_name: 'dev',
          options: {
            named_map: {
              name: 'testing',
              params: {
                color: 'red'
              }
            }
          }
        }, { https: true,  auth_token: 'at_rambo' }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).not.toEqual(undefined);
          layer.layerToken = 'test';
          layer.getTiles(function(tiles) {
            expect(tiles.tiles[0].indexOf("auth_token=at_rambo")).not.toEqual(-1);
          });
          done();
        }, 100);

      });

      it("should create layer form sublayer list", function(done) {
        var layer;

        cartodb.createLayer(map, {
          type: 'cartodb',
          sublayers: [{
            sql: 'select * from table',
            cartocss: 'test',
            interactivity: 'testi'
          }]
        }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).not.toEqual(undefined);
          expect(layer.toJSON()).toEqual({
            version: '1.0.0',
            stat_tag: 'API',
            layers: [{
              type: 'cartodb',
              options: {
                sql: 'select * from table',
                cartocss: 'test',
                cartocss_version: '2.1.0',
                interactivity: ['testi']
              }
            }]
          });
          done();
        }, 100);

      });

      it("should have addTo", function(done) {
        var layer;

        cartodb.createLayer(map, {
          type: 'cartodb',
          sublayers: [{
            sql: 'select * from table',
            cartocss: 'test',
            interactivity: 'testi'
          }]
        })
        .addTo(map)
        .done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).not.toEqual(undefined);
          if(map.overlayMapTypes) {
            expect(layer).toBe(map.overlayMapTypes.getAt(0));
          } else {
            expect(layer).toBe(map._layers[L.stamp(layer)]);
          }
          done();
        }, 100);

      });

    //});

    });
  }

});
