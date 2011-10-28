    
    var stop = false;
    var places = [];
    var place = {};
    var timeout;

    self.onmessage = function(event){
      if (event.data.process=="start") {
        places = event.data.places;
        geocode();
      } else {
        stop = true;
      }
    };

    function geocode() {
      if (places.length>0) {
        place = places.shift();
        place.address = place.address.toLowerCase().replace(/é/g,'e').replace(/á/g,'a').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u');
        importScripts('http://maps.google.com/maps/geo?q='+encodeURIComponent(place.address)+'&sensor=true&output=json&callback=onResultGeocode&key=ABQIAAAAnfs7bKE82qgb3Zc2YyS-oBT2yXp_ZAY8_ufC3CFXhHIE1NvwkxSySz_REpPq-4WZA27OwgbtyR3VcA');
      } else {
        self.postMessage("Finish");
      }
    }


    function onResultGeocode(event) {
      clearTimeout(timeout);
      if (!stop) {
        event.cartodb_id = place.cartodb_id;
        self.postMessage(event);
        timeout = setTimeout(function(){geocode()},300);
      } else {
        stop = false;
        self.postMessage("Stopped");
      }
    }