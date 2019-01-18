

/**
 * geocoders for different services
 *
 * should implement a function called geocode the gets
 * the address and call callback with a list of placemarks with lat, lon
 * (at least)
 */

cdb.geo.geocoder.YAHOO = {

  keys: {
    app_id: "nLQPTdTV34FB9L3yK2dCXydWXRv3ZKzyu_BdCSrmCBAM1HgGErsCyCbBbVP2Yg--"
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
    if (location.protocol.indexOf('http') === -1) {
      protocol = 'http:';
    }

    $.getJSON(protocol + '//query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('SELECT * FROM json WHERE url="http://where.yahooapis.com/geocode?q=' + address + '&appid=' + this.keys.app_id + '&flags=JX"') + '&format=json&callback=?', function (data) {

      var coordinates = [];
      if (data && data.query && data.query.results && data.query.results.json && data.query.results.json.ResultSet && data.query.results.json.ResultSet.Found != "0") {

        // Could be an array or an object |arg!
        var res;

        if (_.isArray(data.query.results.json.ResultSet.Results)) {
          res = data.query.results.json.ResultSet.Results;
        } else {
          res = [data.query.results.json.ResultSet.Results];
        }

        for (var i in res) {
          var r = res[i],
            position;

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

cdb.geo.geocoder.MAPZEN = {
  keys: {
    app_id: "mapzen-YfBeDWS"
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


cdb.geo.geocoder.NOKIA = {

  keys: {
    app_id: "KuYppsdXZznpffJsKT24",
    app_code: "A7tBPacePg9Mj_zghvKt9Q"
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

    $.getJSON(protocol + '//places.nlp.nokia.com/places/v1/discover/search/?q=' + encodeURIComponent(address) + '&app_id=' + this.keys.app_id + '&app_code=' + this.keys.app_code + '&Accept-Language=en-US&at=0,0&callback=?', function (data) {

      var coordinates = [];
      if (data && data.results && data.results.items && data.results.items.length > 0) {

        var res = data.results.items;

        for (var i in res) {
          var r = res[i],
            position;

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
            };
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


cdb.geo.geocoder.MAPBOX = {
  keys: {
    access_token: 'pk.eyJ1IjoiY2FydG8tdGVhbSIsImEiOiJjamNseTl3ZzQwZnFkMndudnIydnJoMXZxIn0.HycQBkaaV7ZwLkHm5hEmfg',
  },

  TYPES : {
    country: 'country',
    region: 'region',
    postcode: 'postal-area',
    district: 'localadmin',
    place: 'venue',
    locality: 'locality',
    neighborhood: 'neighbourhood',
    address: 'address',
    poi: 'venue',
    'poi.landmark': 'venue'
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

    $.getJSON(protocol + '//api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(address) + '.json?access_token=' + this.keys.access_token, function (response) {
      callback(this._formatResponse(response));
    }.bind(this));
  },

  // Transform a raw response into a array with the cartodb format
  _formatResponse: function (rawResponse) {
    if (!rawResponse.features.length) {
      return [];
    }

    return [
      {
        lat: rawResponse.features[0].center[1],
        lon: rawResponse.features[0].center[0],
        type: this.TYPES[rawResponse.features[0].type] || 'default',
        title: rawResponse.features[0].text,
      }
    ];
  }
};