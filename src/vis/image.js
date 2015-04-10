(function() {

  Queue = function() {

    // callback storage
    this._methods = [];

    // reference to the response
    this._response = null;

    // all queues start off unflushed
    this._flushed = false;

  };

  Queue.prototype = {

    // adds callbacks to the queue
    add: function(fn) {

      // if the queue had been flushed, return immediately
      if (this._flushed) {

        // otherwise push it on the queue
        fn(this._response);

      } else {
        this._methods.push(fn);
      }

    },

    flush: function(resp) {

      // flush only ever happens once
      if (this._flushed) {
        return;
      }

      // store the response for subsequent calls after flush()
      this._response = resp;

      // mark that it's been flushed
      this._flushed = true;

      // shift 'em out and call 'em back
      while (this._methods[0]) {
        this._methods.shift()(resp);
      }

    }

  };

  StaticImage = function() {

    Map.call(this, this); 

    this.imageOptions = {};

    this.error = null;

    this.supported_formats = ["png", "jpg"];

    this.defaults = {
      basemap_url_template: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      basemap_subdomains: ["a", "b", "c"],
      format: "png",
      zoom: 10,
      center: [0, 0],
      size:  [320, 240],
      tiler_port: 80,
      tiler_domain: "cartodb.com"
    };

  };

  StaticImage.prototype = _.extend({}, Map.prototype, {

    load: function(vizjson, options) {

      _.bindAll(this, "_onVisLoaded");

      this.queue = new Queue;

      this.no_cdn = options.no_cdn;

      this.userOptions = options;

      options = _.defaults({ vizjson: vizjson, temp_id: "s" + this._getUUID() }, this.defaults);

      this.imageOptions = options;

      cdb.core.Loader.get(vizjson, this._onVisLoaded);

      return this;

    },

    loadLayerDefinition: function(layerDefinition) {

      var self = this;

      this.queue = new Queue;

      if (!layerDefinition.user_name) {
        cartodb.log.error("Please, specify the username");
        return;
      }

      this.options.user_name      = layerDefinition.user_name;
      this.options.tiler_protocol = layerDefinition.tiler_protocol;
      this.options.tiler_domain   = layerDefinition.tiler_domain;
      this.options.tiler_port     = layerDefinition.tiler_port;
      this.options.maps_api_template = layerDefinition.maps_api_template;
      this.endPoint = "/api/v1/map";
      if (!this.options.maps_api_template) {
        this._buildMapsApiTemplate(this.options);
      }

      this.options.layers = layerDefinition;

      this._requestLayerGroupID();

    },

    _onVisLoaded: function(data) {

      if (data) {

        var layerDefinition;
        var baseLayer = data.layers[0];
        var dataLayer = data.layers[1];

        if (dataLayer.options) {
          this.options.user_name = dataLayer.options.user_name;
        }

        // keep this for backward compatibility with tiler_* variables
        if (!dataLayer.options.maps_api_template) {
          this._setupTilerConfiguration(dataLayer.options.tiler_protocol, dataLayer.options.tiler_domain, dataLayer.options.tiler_port);
        } else {
          this.options.maps_api_template = dataLayer.options.maps_api_template;
        }

        this.auth_tokens = data.auth_tokens;

        this.endPoint = "/api/v1/map";

        var bbox = [];

        var bounds = data.bounds;

        if (bounds) {
          bbox.push([bounds[0][1], bounds[0][0]]);
          bbox.push([bounds[1][1], bounds[1][0]]);
        }

        this.imageOptions.zoom   = data.zoom;
        this.imageOptions.center = JSON.parse(data.center);
        this.imageOptions.bbox   = bbox;
        this.imageOptions.bounds = data.bounds;

        if (baseLayer && baseLayer.options) {
          this.imageOptions.basemap = baseLayer;
        }

        /* If the vizjson contains a named map and a torque layer with a named map,
           ignore the torque layer */

        var ignoreTorqueLayer = false;

        var namedMap = this._getLayerByType(data.layers, "namedmap");

        if (namedMap) {

          var torque = this._getLayerByType(data.layers, "torque");

          if (torque && torque.options && torque.options.named_map) {

            if (torque.options.named_map.name === namedMap.options.named_map.name) {
              ignoreTorqueLayer = true;
            }

          }

        }

        var layers = [];
        var basemap = this._getBasemapLayer();

        if (basemap) {
          layers.push(basemap);
        }

        for (var i = 1; i < data.layers.length; i++) {

          var layer = data.layers[i];

          if (layer.type === "torque" && !ignoreTorqueLayer) {

            layers.push(this._getTorqueLayerDefinition(layer));

          } else if (layer.type === "namedmap") {

            layers.push(this._getNamedmapLayerDefinition(layer));

          } else if (layer.type !== "torque" && layer.type !== "namedmap") {

            var ll = this._getLayergroupLayerDefinition(layer);

            for (var j = 0; j < ll.length; j++) {
              layers.push(ll[j]);
            }

          }
        }

        this.options.layers = { layers: layers };
        this._requestLayerGroupID();

      }

    },

    visibleLayers: function() {
      // Overwrites the layer_definition method.
      // We return all the layers, since we have filtered them before
      return this.options.layers.layers;
    },

    _getLayerByType: function(layers, type) {
      return _.find(layers, function(layer) { return layer.type === type; });
    },

    _setupTilerConfiguration: function(protocol, domain, port) {

      this.options.tiler_domain   = domain;
      this.options.tiler_protocol = protocol;
      this.options.tiler_port     = port;

      this._buildMapsApiTemplate(this.options);

    },

    toJSON: function(){
      return this.options.layers;
    },

    _requestLayerGroupID: function() {

      var self = this;

      this.getLayerToken(function(data, error) {

        if (error) {
          self.error = error;
        }

        if (data) {
          self.imageOptions.layergroupid = data.layergroupid;
          self.cdn_url = data.cdn_url;
        }

        self.queue.flush(this);

      });

    },

    _getDefaultBasemapLayer: function() {

      return {
        type: "http",
        options: {
          urlTemplate: this.defaults.basemap_url_template,
          subdomains:  this.defaults.basemap_subdomains
        }
      };

    },

    _getHTTPBasemapLayer: function(basemap) {

      var urlTemplate = basemap.options.urlTemplate;

      if (!urlTemplate) {
        return null;
      }

      return {
        type: "http",
        options: {
          urlTemplate: urlTemplate,
          subdomains: basemap.options.subdomains || this.defaults.basemap_subdomains
        }
      };

    },

    _getPlainBasemapLayer: function(color) {

      return {
        type: "plain",
        options: {
          color: color
        }
      };

    },

    _getBasemapLayer: function() {

      var basemap = this.userOptions.basemap || this.imageOptions.basemap;

      if (basemap) {

        // TODO: refactor this
        var type = basemap.type.toLowerCase();

        if (basemap.options && basemap.options.type) {
          type = basemap.options.type.toLowerCase();
        }

        if (type === "plain") {
          return this._getPlainBasemapLayer(basemap.options.color);
        } else {
          return this._getHTTPBasemapLayer(basemap);
        }

      }

      return this._getDefaultBasemapLayer();

    },

    _getTorqueLayerDefinition: function(layer_definition) {

      if (layer_definition.options.named_map) { // If the layer contains a named map inside, use it instead
        return this._getNamedmapLayerDefinition(layer_definition);
      }

      var layerDefinition = new LayerDefinition(layer_definition, layer_definition.options);

      var query    = layerDefinition.options.query || "SELECT * FROM " + layerDefinition.options.table_name;
      var cartocss = layer_definition.options.tile_style;

      return {
        type: "torque",
        options: {
          sql: query,
          cartocss: cartocss
        }
      };

    },

    _getLayergroupLayerDefinition: function(layer) {

      var options = layer.options;

      options.layer_definition.layers = this._getVisibleLayers(options.layer_definition.layers);

      var layerDefinition = new LayerDefinition(options.layer_definition, options);

      return layerDefinition.toJSON().layers;

    },

    _getNamedmapLayerDefinition: function(layer) {

      var options = layer.options;

      var layerDefinition = new NamedMap(options.named_map, options);

      var options = {
        name: layerDefinition.named_map.name
      };

      if (this.auth_tokens && this.auth_tokens.length > 0) {
        options.auth_tokens = this.auth_tokens;
      }

      return {
        type: "named",
        options: options
      }

    },

    _getVisibleLayers: function(layers) {
      return _.filter(layers, function(layer) { return layer.visible; });
    },

    _getUrl: function() {

      var username     = this.options.user_name;
      var bbox         = this.imageOptions.bbox;
      var layergroupid = this.imageOptions.layergroupid;
      var zoom         = this.imageOptions.zoom   || this.defaults.zoom;
      var center       = this.imageOptions.center || this.defaults.center;
      var size         = this.imageOptions.size   || this.defaults.size;
      var format       = this.imageOptions.format || this.defaults.format;

      var lat    = center[0];
      var lon    = center[1];

      var width  = size[0];
      var height = size[1];

      var subhost = this.isHttps() ? null : "a";

      var url = this._host(subhost) + this.endPoint;

      if (bbox && bbox.length && !this.userOptions.override_bbox) {
        return [url, "static/bbox" , layergroupid, bbox.join(","), width, height + "." + format].join("/");
      } else {
        return [url, "static/center" , layergroupid, zoom, lat, lon, width, height + "." + format].join("/");
      }

    },

    // Generates a random string
    _getUUID: function() {
      var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    },

    /* Setters */
    _set: function(name, value) {

      var self = this;

      this.queue.add(function() {
        self.imageOptions[name] = value;
      });

      return this;

    },

    zoom: function(zoom) {
      return this._set("zoom", zoom);
    },

    bbox: function(bbox) {
      return this._set("bbox", bbox);
    },

    center: function(center) {
      this._set("bbox", null);
      return this._set("center", center);
    },

    format: function(format) {
      return this._set("format", _.include(this.supported_formats, format) ? format : this.defaults.format);
    },

    size: function(width, height) {
      return this._set("size", [width, height === undefined ? width : height]);
    },

    /* Methods */

    /* Image.into(HTMLImageElement)
       inserts the image in the HTMLImageElement specified */
    into: function(img) {

      var self = this;

      if (!(img instanceof HTMLImageElement)) {
        cartodb.log.error("img should be an image");
        return;
      }

      this.imageOptions.size = [img.width, img.height];

      this.queue.add(function(response) {
        img.src = self._getUrl();
      });

    },

    /* Image.getUrl(callback(err, url))
       gets the url for the image, err is null is there was no error */

    getUrl: function(callback) {

      var self = this;

      this.queue.add(function() {
        if (callback) {
          callback(self.error, self._getUrl()); 
        }
      });

    },

    /* Image.write(attributes)
       adds a img tag in the same place script is executed */

    write: function(attributes) {

      var self = this;

      this.imageOptions.attributes = attributes;

      if (attributes && attributes.src) {
        document.write('<img id="' + this.imageOptions.temp_id + '" src="'  + attributes.src + '" />');
      } else {
        document.write('<img id="' + this.imageOptions.temp_id + '" />');
      }

      this.queue.add(function() {

        var element = document.getElementById(self.imageOptions.temp_id);

        element.src = self._getUrl();
        element.removeAttribute("temp_id");

        var attributes = self.imageOptions.attributes;

        if (attributes && attributes.class) { element.setAttribute("class", attributes.class); }
        if (attributes && attributes.id)    { element.setAttribute("id", attributes.id); }

      });

      return this;
    }

  })

  cdb.Image = function(data, options) {

    if (!options) options = {};

    var image = new StaticImage();

    if (typeof data === 'string') {
      image.load(data, options);
    } else {
      image.loadLayerDefinition(data);
    }

    return image;

  };

})();
