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
    it("should return an error for unknow map types", function(done) {
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
        spyOn(cdb.core.Loader, 'get');
        cartodb.createLayer(map, {
          user: 'development',
          table: 'clubbing',
          host: 'localhost.lan:3000',
          protocol: 'http'
        });
        expect(cdb.core.Loader.get).toHaveBeenCalled();
      });

      it("should fecth layer when a url is specified", function() {
        spyOn(cdb.core.Loader, 'get');
        cartodb.createLayer(map, 'http://test.com/layer.json');
        expect(cdb.core.Loader.get).toHaveBeenCalled();
      });

      it("should not fecth layer when kind and options are specified", function() {
        spyOn(cdb.core.Loader, 'get');
        cartodb.createLayer(map, { kind: 'plain', options: {} });
        expect(cdb.core.Loader.get).not.toHaveBeenCalled();
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
            { type: 'tiled', options: {} },
            {
              type: 'layergroup',
              options: {
                layer_definition: {
                  layers: []
                },
                extra_params: { cache_buster: 'cb' }
              }
            }
          ]
        }, s).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(s.called).toEqual(true);
          expect(layer.model.attributes.extra_params.cache_buster).toEqual('cb');
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

      it("should load the `namedmap` layer by default", function(done) {
        var layer;

        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            { type: 'tiled', options: {} },
            { type: 'tiled', options: {} },
            {
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
            }
          ]
        }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).toBeDefined();
          expect(layer.options.type).toEqual('namedmap');
          done();
        }, 0);
      });

      it("should load the `layergroup` layer by default", function(done) {
        var layer;

        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            { type: 'tiled', options: {} },
            { type: 'tiled', options: {} },
            {
              type: 'layergroup',
              options: {
                layer_definition: {
                  layers: []
                }
              }
            }
          ]
        }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).toBeDefined();
          expect(layer.options.type).toEqual('layergroup');
          done();
        }, 0);
      });

      it("should load the `torque` layer by default", function(done) {
        var layer;

        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            { type: 'tiled', options: {} },
            { type: 'tiled', options: {} },
            {
              type: 'torque',
              options: {
                'torque-steps': 3
              }
            }
          ]
        }).done(function(lyr) {
          layer = lyr;
        });

        setTimeout(function() {
          expect(layer).toBeDefined();
          expect(layer.type).toEqual('torque');
          done();
        }, 0);
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

      it("should ask for https data when https is on at torque layer", function(done) {
        var layer;
        var s = sinon.spy();
        
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
            {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}, infowindow: null }
          ]
        }, { layerIndex: 2, https: true }, s).done(function(lyr) {
          layer = lyr;
          
        }).addTo(map)

        var wait = 500;
        if (!map.getContainer) wait = 2500;

        setTimeout(function() {
          expect(layer.provider.options.tiler_protocol).toBe("https");
          done()
        }, wait);
      });

      it("should not add a torque layer timeslider if steps are not greater than 1", function(done) {
        var layer;
        var s = sinon.spy();
        
        cartodb.createLayer(map, {
          updated_at: 'jaja',
          layers: [
            null,
            {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
            {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 1;} #test { marker-width: 10; }'}, infowindow: null }
          ]
        }, { layerIndex: 2 }, s).done(function(lyr) {
          layer = lyr;
        }).addTo(map)

        var wait = 500;
        if (!map.getContainer) wait = 2500;

        setTimeout(function() {
          if (map.getContainer) expect($(map.getContainer()).find('.cartodb-timeslider').length).toBe(0)
          if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-timeslider').length).toBe(0)
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
        }, { https: true,  auth_token: 'at_rambo' }).done(function(layer) {
          spyOn(layer, 'createMap').and.returnValue({
            layergroupid: 'test',
            metadata: {
              layers: []
            }
          })
          layer.getTiles(function(tiles) {
            expect(tiles.tiles[0].indexOf("auth_token=at_rambo")).not.toEqual(-1);
          });
          done();
        });
      });

      it("should create a layer from the list of sublayers", function(done) {
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
            version: '1.3.0',
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

      it("should return a promise that responds to addTo", function(done) {
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

      it("should have several 'addTo' with zIndex set", function(done) {
        var layer0, layer1;

        cartodb.createLayer(map, {
          type: 'cartodb',
          sublayers: [{
            sql: 'select * from table',
            cartocss: 'test',
            interactivity: 'testi'
          }]
        })
        .addTo(map,0)
        .done(function(lyr) {
          layer0 = lyr;
        });

        cartodb.createLayer(map, {
          type: 'cartodb',
          sublayers: [{
            sql: 'select * from table2',
            cartocss: 'test2',
            interactivity: 'testii'
          }]
        })
        .addTo(map,1)
        .done(function(lyr) {
          layer1 = lyr;
        });

        setTimeout(function() {
          //Test only for Leaflet 
          if(map.overlayMapTypes === undefined) {
            expect(layer0).not.toEqual(undefined);
            expect(layer0.options.zIndex).toEqual(0);
            expect(layer1).not.toEqual(undefined);
            expect(layer1.options.zIndex).toEqual(1);
          }
          done();
        }, 100);
      });
    });
  }

});
