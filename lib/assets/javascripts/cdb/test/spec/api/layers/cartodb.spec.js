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

    it("has all the needed methods", function(done) {
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

      cartodb.createLayer(map, { kind: 'cartodb', options: { table_name:'test', tile_style: 'test', user_name: 'test'} }, function(l) {
        layer = l;
      });

      setTimeout(function() {
        _.each(methods, function(m) {
          expect(layer[m]).not.toEqual(undefined);
        })
        done();
      }, 100);
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


    it("should add a infowindow", function(done) {
      //cdb.templates.add(new cdb.core.Template({
        //name: 'test',
      //}));

      cartodb.createLayer(map, { 
          kind: 'cartodb', 
          options: { 
            table_name: 'test',
            user_name: 'test',
            tile_style: 'tesst'
          },
          infowindow: { 
            template: '<div></div>',
            fields: [{name: 'test', title: true, order: 0}] 
          }
      }, function(l) {
        addFn(map, l);
        layer = l;
      });

      setTimeout(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.infowindow.get('fields').length).toEqual(1);
        expect(layer.infowindow.get('fields')[0].name).toEqual('test');
        expect(layer.options.interactivity).toEqual('cartodb_id');
        done();
      }, 100);
    });

    it("should expose the legend", function(done) {
      var legend = {
        type: "custom",
        show_title: true,
        title: "wadus",
        template: "",
        items: [
          {
            name: "item1",
            visible: true,
            value: "#FFCC00",
            sync: true
          },
          {
            name: "item2",
            visible: true,
            value: "#3B007F",
            sync: true
          }
        ]
      };

      cartodb.createLayer(map, {
        kind: 'cartodb',
        options: {
          table_name: 'test',
          user_name: 'test',
          tile_style: 'tesst'
        },
        infowindow: {
          template: '<div></div>',
          fields: [{name: 'test', title: true, order: 0}]
        },
        legend: legend,
        visible: true
      }, function(l) {
        addFn(map, l);
        layer = l;
      });

      setTimeout(function() {
        expect(layer.legend instanceof cdb.geo.ui.LegendModel).toBeTruthy();
        expect(layer.legend.get('visible')).toBeTruthy();
        expect(layer.legend.get('items')).toEqual(legend.items);
        done();
      }, 100);
    });

    it("should add interactivity if there is infowindow", function(done) {
      cartodb.createLayer(map, { 
          kind: 'cartodb', 
          options: { 
            table_name: 'test',
            user_name: 'test',
            tile_style: 'test'
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

      setTimeout(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.options.interactivity).toEqual('myname,jaja,cartodb_id');
        done();
      }, 100);
    });

    it("should not add interactivity when interaction is false", function(done) {

      cartodb.createLayer(map, { 
          kind: 'cartodb', 
          options: { 
            table_name: 'test',
            user_name: 'test',
            tile_style: 'test'
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

      setTimeout(function() {
        expect(layer.infowindow).not.toEqual(undefined);
        expect(layer.options.interactivity).toEqual('myname,jaja,cartodb_id');
        expect(layer.options.interaction).toEqual(false);
        done();
      }, 100);
    });

    it("should add to the map when done", function() {
      cartodb.createLayer(map, { 
          kind: 'cartodb', 
          options: { 
            table_name: 'test',
            user_name: 'test',
            tile_style: 'test'
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


  };

});


