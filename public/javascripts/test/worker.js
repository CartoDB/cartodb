
  var places;
  
  self.onmessage = function(event){
    places = event.data;
    geocode();
  };
  
  function geocode() {
    if (places.length>0) {
      var place = places.shift();
      importScripts('http://maps.google.com/maps/geo?q='+escape(place)+'&sensor=false&output=json&callback=onResultGeocode');
    } else {
      self.postMessage("Finish");
    }
  }
  
  
  function onResultGeocode(event) {
    geocode();
    self.postMessage(event);
  }