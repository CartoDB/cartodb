
/**
 * Windshaft client. It provides a method to create instances of maps.
 * @param {object} options Options to set up the client
 */
cdb.windshaft.Client = function(options) {
  this.COMPRESSION_LEVEL = 3;
  this.ajax = options.ajax;
  this.baseUrl = options.maps_api_template;
  this.statTag = options.stat_tag;
  this.forceCompress = options.force_compress;
  this.isCorsSupported = cdb.core.util.isCORSSupported();
  this.forceCors = options.force_cors;
  this.endpoint = '/api/v1/map';

  // WARNING: This option is called instanciateCallback (tanci instead of tanti)
  this.instantiateCallback = function(payload) {
    return '_cdbc_' + this._jsonpCallbackName(payload);
  }.bind(this);
}

cdb.windshaft.Client.MAX_GET_SIZE = 2033;

/**
 * Creates an instance of a map in Windshaft
 * @param {object} mapDefinition An object that responds to .toJSON with the definition of the map
 * @param  {function} callback A callback that will get the public or private map
 * @return {cdb.windshaft.PublicMap|cdb.windshaft.PrivateMap} The instance of the map
 */
cdb.windshaft.Client.prototype.instantiateMap = function(mapDefinition, callback) {
  var payload = JSON.stringify(mapDefinition.toJSON());
  
  if (this._usePOST(payload)) {
    this._post(payload, callback);
  } else {
    this._get(payload, callback);
  }
}

cdb.windshaft.Client.prototype._usePOST = function(payload) {
  if (this.isCorsSupported && this.forceCors) {
    return true;
  }
  return payload.length >= this.constructor.MAX_GET_SIZE;
}

cdb.windshaft.Client.prototype._post = function(payload, callback) {
  this.ajax({
    crossOrigin: true,
    type: 'POST',
    method: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: this._getURL(),
    data: payload,
    success: function(data) {
      if (data.errors) {
        callback(null, data);
      } else {
        callback(data);
      }
    },
    error: function() {
      var err = { errors: ['Unknown error'] };
      try {
        err = JSON.parse(xhr.responseText);
      } catch(e) {}
      // if(0 === self._createMapCallsStack.length) {
        callback(null, err);
      // }
    }
  });
}

cdb.windshaft.Client.prototype._get = function(payload, callback) {
  var compressFunction = this._getCompressor(payload);
  compressFunction(payload, this.COMPRESSION_LEVEL, function(dataParameter) {
    this.ajax({
      url: this._getURL(dataParameter),
      dataType: 'jsonp',
      jsonpCallback: function() {
        return this.instantiateCallback(payload);
      }.bind(this),
      cache: true,
      success: function(data) {
        if (data.errors) {
          callback(null, data);
        } else {
          callback(data);
        }
      },
      error: function() {
        var err = { errors: ['Unknown error'] };
        try {
          err = JSON.parse(xhr.responseText);
        } catch(e) {}
        // if(0 === self._createMapCallsStack.length) {
          callback(null, err);
        // }
      }
    });    
  }.bind(this));
}

cdb.windshaft.Client.prototype._getCompressor = function(payload) {
  if (!this.forceCompress && payload.length < this.constructor.MAX_GET_SIZE) {
    return function(data, level, callback) {
      callback("config=" + encodeURIComponent(data));
    };
  }

  return function(data, level, callback) {
    data = JSON.stringify({ config: data });
    LZMA.compress(data, level, function(encoded) {
      callback("lzma=" + encodeURIComponent(cdb.core.util.array2hex(encoded)));
    });
  };
}


cdb.windshaft.Client.prototype._getURL = function(dataParameter) {
  var params = [];
  params.push(["stat_tag", this.statTag].join("="));
  if (dataParameter) {
    params.push(dataParameter);  
  }
  return this.baseUrl + this.endpoint + '?' + params.join('&');
}

cdb.windshaft.Client.prototype._jsonpCallbackName = function(payload) {
  return cdb.core.util.uniqueCallbackName(payload);
}