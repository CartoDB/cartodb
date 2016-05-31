var $ = require('jquery');

/**
 * geocoders for different services
 *
 * should implement a function called geocode the gets
 * the address and call callback with a list of placemarks with lat, lon
 * (at least)
 */
var MAPZEN = {
  keys: {
    app_id: 'search-DH1Lkhw'
  },

  geocode: function (address, callback) {
    address = address.toLowerCase()
      .replace(/é/g, 'e')
      .replace(/á/g, 'a')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u');

    var protocol = '';
    if (location.protocol.indexOf('http') === -1) {
      protocol = 'http:';
    }

    $.getJSON(protocol + '//search.mapzen.com/v1/search?text=' + encodeURIComponent(address) + '&api_key=' + this.keys.app_id, function (data) {
      var coordinates = [];
      if (data && data.features && data.features.length > 0) {
        var res = data.features;
        for (var i in res) {
          var r = res[i],
            position;
          position = {
            lat: r.geometry.coordinates[1],
            lon: r.geometry.coordinates[0]
          };
          if (r.properties.layer) {
            position.type = r.properties.layer;
          }
          if (r.properties.label) {
            position.title = r.properties.label;
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

module.exports = MAPZEN;