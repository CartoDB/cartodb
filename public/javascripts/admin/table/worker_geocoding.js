
    var places = [];
    var place = {};

    self.onmessage = function(event){
      places = event.data;
      geocode();
    };

    function geocode() {
      if (places.length>0) {
        place = places.shift();
        importScripts('http://maps.google.com/maps/geo?q='+encodeURIComponent(place.address)+'&sensor=false&output=json&callback=onResultGeocode');
      } else {
        self.postMessage("Finish");
      }
    }


    function onResultGeocode(event) {
      event.cartodb_id = place.cartodb_id;
      self.postMessage(event);
      geocode();
    }