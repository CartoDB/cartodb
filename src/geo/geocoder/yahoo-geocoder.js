var _ = require('underscore');
var $ = require('jquery');

/**
* geocoders for different services
*
* should implement a function called geocode the gets
* the address and call callback with a list of placemarks with lat, lon
* (at least)
*/
var YAHOO = {
  keys: {
    app_id: 'nLQPTdTV34FB9L3yK2dCXydWXRv3ZKzyu_BdCSrmCBAM1HgGErsCyCbBbVP2Yg--'
  },

  geocode: function (address, callback) {
    address = address.toLowerCase()
      .replace(/é/g, 'e')
      .replace(/á/g, 'a')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ /g, '+');

    var protocol = '';
    if (window.location.protocol.indexOf('http') === -1) {
      protocol = 'http:';
    }

    $.getJSON(protocol + '//query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('SELECT * FROM json WHERE url="http://where.yahooapis.com/geocode?q=' + address + '&appid=' + this.keys.app_id + '&flags=JX"') + '&format=json&callback=?', function (data) {
      var coordinates = [];
      if (data && data.query && data.query.results && data.query.results.json && data.query.results.json.ResultSet && data.query.results.json.ResultSet.Found !== '0') {
        // Could be an array or an object |arg!
        var res;

        if (_.isArray(data.query.results.json.ResultSet.Results)) {
          res = data.query.results.json.ResultSet.Results;
        } else {
          res = [data.query.results.json.ResultSet.Results];
        }

        for (var i in res) {
          var r = res[i];
          var position;

          position = {
            lat: r.latitude,
            lon: r.longitude
          };

          if (r.boundingbox) {
            position.boundingbox = r.boundingbox;
          }

          coordinates.push(position);
        }
      }

      callback(coordinates);
    });
  }
};

module.exports = YAHOO;
