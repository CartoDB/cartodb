
  var places;
  
  self.onmessage = function(event){
    places = event.data;
    geocode();
  };
  
  function geocode() {
    // if (places.length>0) {
    //   var place = places.shift();

      
      
      // requestNumber = JSONRequest.get(
      //     'http://maps.google.com/maps/geo?q='+escape(place)+'&sensor=false&output=json&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RR_u7eJr86POocizq-6e8YHXi9UChSNdQHSPY7oPxUcuoQKcFJS8N7GZQ', 
      //     {}, 
      //     function (requestNumber, value, exception) {
      //         console.log(value);
      //     }
      // );
      
      // JSONRequest.done = onResultGeocode;
      // JSONRequest.url = 'http://maps.google.com/maps/geo?q='+escape(place)+'&sensor=false&output=json&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RR_u7eJr86POocizq-6e8YHXi9UChSNdQHSPY7oPxUcuoQKcFJS8N7GZQ';
      // JSONRequest.send();
      importScripts('http://maps.google.com/maps/geo?q=Castellana+Madrid&sensor=false&output=xml&callback=onResultGeocode&key=ABQIAAAAsIunaSEq-72JsQD5i92_2RT2yXp_ZAY8_ufC3CFXhHIE1NvwkxSmXGohiWEDHFUoXFZA7xt2aNO4ww');
    // } else {
    //   self.postMessage("Finish");
    // }
  }
  
  
  function onResultGeocode(event) {
    // event.jam = "jam";
    // geocode();
    self.postMessage(event);
  }