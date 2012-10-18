describe('api.layers.cartodb', function() {

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

  //
  // shared specs for each map
  //
  function loadLayerSpecs(mapFn) {
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
        cartodb.createLayer(map, { kind: 'cartodb', options: {} }, function(l) {
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
  };

});


