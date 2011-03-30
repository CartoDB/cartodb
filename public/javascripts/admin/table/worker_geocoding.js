    
    var stop = false;
    var places = [];
    var place = {};

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
        place.address = place.address.toLowerCase().replace(/é/g,'e').replace(/á/g,'a').replace(/í/g,'i').replace(/ó/g,'').replace(/ú/g,'u');
        //importScripts('http://local.yahooapis.com/MapsService/V1/geocode?appid=dj0yJmk9NzhmdUJleDhhZVUxJmQ9WVdrOVNVdFVkR0ZZTkdzbWNHbzlNVEk1TURVNU5qVTJNZy0tJnM9Y29uc3VtZXJzZWNyZXQmeD0wYg--&output=json&location=1071+Fifth+Avenue&callback=onResultGeocode');
              importScripts('http://maps.google.com/maps/geo?q='+encodeURIComponent(place.address)+'&sensor=false&output=json&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RQOqZTZJp2W5qrc2piUcZdFvKIWlxTz1ttXhbjhedwhPFItME8qyUz-Yw');
      } else {
        self.postMessage("Finish");
      }
    }


    function onResultGeocode(event) {
      if (!stop) {
        event.cartodb_id = place.cartodb_id;
        self.postMessage(event);
        setTimeout(function(){geocode()},1000);
      } else {
        stop = false;
        self.postMessage("Stopped");
      }
    }