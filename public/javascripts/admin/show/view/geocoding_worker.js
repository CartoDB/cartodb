    
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
        place.address = place.address.toLowerCase().replace(/é/g,'e').replace(/á/g,'a').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/ /g,'+');
        importScripts('http://query.yahooapis.com/v1/public/yql?q='+encodeURIComponent('SELECT * FROM json WHERE url="http://where.yahooapis.com/geocode?q=' + place.address + '&appid=nLQPTdTV34FB9L3yK2dCXydWXRv3ZKzyu_BdCSrmCBAM1HgGErsCyCbBbVP2Yg--&flags=J"') + '&format=json&callback=onResultGeocode');
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