var $ = require('jquery');

/**
 * geocoders for different services
 *
 * should implement a function called geocode the gets
 * the address and call callback with a list of placemarks with lat, lon
 * (at least)
 */
var NOKIA = {
  keys: {
    app_id:   "KuYppsdXZznpffJsKT24",
    app_code: "A7tBPacePg9Mj_zghvKt9Q"
  },

  geocode: function(address, callback) {
    address = address.toLowerCase()
      .replace(/é/g,'e')
      .replace(/á/g,'a')
      .replace(/í/g,'i')
      .replace(/ó/g,'o')
      .replace(/ú/g,'u');

    var protocol = '';
    if(location.protocol.indexOf('http') === -1) {
      protocol = 'http:';
    }

    $.getJSON(protocol + '//places.nlp.nokia.com/places/v1/discover/search/?q=' + encodeURIComponent(address) + '&app_id=' + this.keys.app_id + '&app_code=' + this.keys.app_code + '&Accept-Language=en-US&at=0,0&callback=?', function(data) {

       var coordinates = [];
       if (data && data.results && data.results.items && data.results.items.length > 0) {

        var res = data.results.items;

        for(var i in res) {
          var r = res[i]
            , position;

          position = {
            lat: r.position[0],
            lon: r.position[1]
          };

          if (r.bbox) {
            position.boundingbox = {
              north: r.bbox[3],
              south: r.bbox[1],
              east: r.bbox[2],
              west: r.bbox[0]
            }
          }
          if (r.category) {
            position.type = r.category.id;
          }
          if (r.title) {
            position.title = r.title;
          }
          coordinates.push(position);
        }
      }

      if (callback) {
        callback.call(this, coordinates);
      }
    });
  }
};

module.exports = NOKIA;
