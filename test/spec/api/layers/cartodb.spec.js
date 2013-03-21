describe('api.layers.cartodb', function() {

  describe('loadLayer leaflet', function() {
    loadLayerSpecs(function() {
      return L.map($('<div>')[0]).setView([0, 0], 3);
    }, function(map, layer) {
    map.addLayer(layer);
    });
  });

  describe('loadLayer gmaps', function() {
    loadLayerSpecs(function() {
      return new google.maps.Map($('<div>')[0],{
        zoom: 3,
        center: new google.maps.LatLng(0, 0),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
    },
    function(map, layer) {
      map.overlayMapTypes.setAt(0, layer);
    });
  });

  //
  // shared specs for each map
  //
  function loadLayerSpecs(mapFn, addFn) {
    var layer;
    var map;
    beforeEach(function() {
        map = mapFn();
    });
    it("has all the needed methods", function() {
      var methods = [
        'show',
        'hide',
        'setInteraction',
        'setQuery',
        'setCartoCSS',
        'isVisible',
        'setInteractivity',
        'setOpacity',
        'setOptions'
      ];

      runs(function() {
        cartodb.createLayer(map, { kind: 'cartodb', options: { table_name:'test', tile_style: 'test', user_name: 'test'} }, function(l) {
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        _.each(methods, function(m) {
          console.log(m, layer[m]?true:false);
          expect(layer[m]).not.toEqual(undefined);
        })
      });

    });

    function get_url_options(u) {
      var o = u.split('?')[1].split('&');
      var opts = {};
      for(var i in o) {
        var tk = o[i].split('=');
        opts[tk[0]] = decodeURIComponent(tk[1]);
      }
      return opts;
    }

    xit("should add style to the tile url", function() {
      runs(function() {
        cartodb.createLayer(map, { kind: 'cartodb', options: { table_name:'test', tile_style: 'test', user_name: 'test', ajax: ajax} }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        layer.setCartoCSS('#{{table_name}} { polygon-fill: red; }');
        expect(JSON.parse(last_params.data).layers[0].options.cartocss).toEqual('#{{table_name}} { polygon-fill: red; }');


        layer.setCartoCSS('#{{table_name}} { polygon-fill: red; }', '2.0.10');
        expect(JSON.parse(last_params.data).layers[0].options.cartocss_version).toEqual('2.0.10');

      });
    });

    it("should add query to the tile url", function() {
      var last_params;
      function ajax(params) {
        last_params = params;
      }
      runs(function() {
        cartodb.createLayer(map, { kind: 'cartodb', options: { table_name:'test', tile_style: 'test', user_name: 'test', ajax: ajax} }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        layer.setQuery('select * from jaja limit 1');
        expect(JSON.parse(last_params.data).layers[0].options.sql).toEqual('select * from jaja limit 1');

        layer.setQuery(null);
        expect(JSON.parse(last_params.data).layers[0].options.sql).toEqual('select * from test');
      });


    });

    it("should add interaction to the grid", function() {
      var last_params;
      function ajax(params) {
        params.success({
          layergroupid: 'test'
        });
      }
      runs(function() {
        cartodb.createLayer(map, { kind: 'cartodb', options: { table_name:'test', tile_style: 'test', user_name: 'test', ajax: ajax} }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        layer.setInteractivity(['cartodb_id', 'test']);
        var t = layer._tileJSON();
        var opts = get_url_options(t.grids[0]);
        expect(opts.interactivity).toEqual('cartodb_id,test');

        layer.setOptions({interactivity: ['cartodb_id', 'test'] });
        var t = layer._tileJSON();
        var opts = get_url_options(t.grids[0]);
        expect(opts.interactivity).toEqual('cartodb_id,test');

      });
    });

    it("should add a infowindow", function() {
      //cdb.templates.add(new cdb.core.Template({
        //name: 'test',
      //}));
      runs(function() {
        cartodb.createLayer(map, { 
            kind: 'cartodb', 
            options: { 
              table_name: 'test',
              user_name: 'test'
            },
            infowindow: { 
              template: '<div></div>',
              fields: [{name: 'test', title: true, order: 0}] 
            }
        }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.infowindow.get('fields').length).toEqual(1);
        expect(layer.infowindow.get('fields')[0].name).toEqual('test');
        expect(layer.options.interactivity).toEqual('cartodb_id');
      });
    });

    it("should add interactivity if there is infowindow", function() {
      runs(function() {
        cartodb.createLayer(map, { 
            kind: 'cartodb', 
            options: { 
              table_name: 'test',
              user_name: 'test'
            },
            infowindow: { 
              template: '<div></div>',
              fields: [{name: 'test', title: true, order: 0}] 
            }
        }, {
          interactivity: 'myname,jaja'
        }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.options.interactivity).toEqual('myname,jaja,cartodb_id');
      });
    });

    it("should not add interactivity when interaction is false", function() {
      runs(function() {
        cartodb.createLayer(map, { 
            kind: 'cartodb', 
            options: { 
              table_name: 'test',
              user_name: 'test'
            },
            infowindow: { 
              template: '<div></div>',
              fields: [{name: 'test', title: true, order: 0}] 
            }
        }, {
          interactivity: 'myname,jaja',
          interaction: false
        }, function(l) {
          addFn(map, l);
          layer = l;
        });
      });
      waits(100);
      runs(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.options.interactivity).toEqual('myname,jaja,cartodb_id');
        expect(layer.options.interaction).toEqual(false);
        expect(layer.interaction).toEqual(null);
      });
    });


  };

});


