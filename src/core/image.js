(function() {

  function Queue() {

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

  ImageModel = cdb.core.Model.extend({
    defaults: {
      format: "png",
      zoom: 10,
      center: [0, 0],
      size:  [320, 240],
      tiler_port: 80,
      tiler_domain: "cartodb.com"
    }
  });

  var Image = function() {

    var self = this;

    this.model = new ImageModel();

    this.supported_formats = ["png", "jpg"];

    this.defaults = {
      tiler_domain: "cartodb.com",
      tiler_port: "80"
    };

    this.available_basemaps = ["light_all", "light_nolabels", "dark_all", "dark_nolabels"];
    this.options = _.defaults({
      ajax: window.$ ? window.$.ajax : reqwest.compat,
      pngParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
      gridParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
      cors: this.isCORSSupported(),
      btoa: this.isBtoaSupported() ? this._encodeBase64Native : this._encodeBase64,
      MAX_GET_SIZE: 2033,
      force_cors: false,
      instanciateCallback: function() {
        return '_cdbc_' + self._callbackName();
      }
    });

    this.layerToken = null;
    this.urls = null;
    this.silent = false;
    this.interactionEnabled = []; //TODO: refactor, include inside layer
    this._layerTokenQueue = [];
    this._timeout = -1;
    this._queue = [];
    this._waiting = false;
    this.lastTimeUpdated = null;
    this._refreshTimer = -1;

  };

  Image.prototype = _.extend({}, Map.prototype, {

    load: function(vizjson, options) {

      _.bindAll(this, "_onVisLoaded");

      this.queue = new Queue;

      options = _.defaults(options, { vizjson: vizjson, temp_id: "s" + this._getUUID() }, this.model.defaults);

      this.model.set(options);

      cdb.image.Loader.get(vizjson, this._onVisLoaded);

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
      this.endPoint = "/api/v1/map";

      this.options.layers = layerDefinition;

      this._getLayerGroupID();

    },

    _onVisLoaded: function(data) {

      if (data) {

        var layerDefinition;
        var baseLayer = data.layers[0];
        var dataLayer = data.layers[1];

        this._chooseBasemap(baseLayer.options);

        this.options.user_name      = dataLayer.options.user_name;
        this.options.tiler_protocol = dataLayer.options.tiler_protocol;
        this.options.tiler_domain   = dataLayer.options.tiler_domain;
        this.options.tiler_port     = dataLayer.options.tiler_port;

        this.endPoint = "/api/v1/map";

        this.model.set({
          zoom: data.zoom,
          center: JSON.parse(data.center),
          bounds: data.bounds
        });

        if (dataLayer.type === "namedmap") {
          this.options.layers = this._getNamedmapLayerDefinition(dataLayer.options);
        } else {
          this.options.layers = this._getLayergroupLayerDefinition(dataLayer.options);
        }

        this._getLayerGroupID();

      }

    },

    toJSON: function(){
      return this.options.layers;
    },

    _getLayerGroupID: function() {

      var self = this;

      this._requestPOST({}, function(data) {

        if (data) {
          self.model.set("layergroupid", data.layergroupid);
          self.queue.flush(this);
        }

      });

    },

    _getBasemapLayer: function() {

      return {
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/" + this.model.get("basemap") + "/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      };

    },

    _getLayergroupLayerDefinition: function(options) {

      var layerDefinition = new LayerDefinition(options.layer_definition, options);

      var ld = layerDefinition.toJSON();

      // TODO: remove this
      //for (var i = 0; i<ld.layers.length; i++) {
        //delete ld.layers[i].options.interactivity
      //}

      ld.layers.unshift(this._getBasemapLayer());

      return ld;

    },

    _getNamedmapLayerDefinition: function(options) {

      var layerDefinition = new NamedMap(options.named_map, options);

      layerDefinition.options.type = "named";

      var layers  =  [
        this._getBasemapLayer(), {
        type: "named",
        options: {
          name: layerDefinition.named_map.name
        }
      }];

      var ld = {
        layers: layers
      };

      return ld;

    },

    _getUrl: function() {

      var username     = this.options.user_name;
      var zoom         = this.model.get("zoom");
      var bbox         = this.model.get("bbox");
      var lat          = this.model.get("center")[0];
      var lon          = this.model.get("center")[1];
      var width        = this.model.get("size")[0];
      var height       = this.model.get("size")[1];
      var layergroupid = this.model.get("layergroupid");
      var format       = this.model.get("format");

      var url = this._tilerHost() + this.endPoint;

      if (bbox) {
        return [url, "static/bbox" , layergroupid, bbox[0].join(",") + "," + bbox[1].join(","), width, height + "." + format].join("/");
      } else {
        return [url, "static/center" , layergroupid, zoom, lat, lon, width, height + "." + format].join("/");
      }

    },

    _chooseBasemap: function(basemap_layer) { 

      if (this.model.get("basemap")) return;

      var type = basemap_layer.base_type;

      if (!_.include(this.available_basemaps, type)) {

        if (type && type.indexOf("toner") !== -1)      basemap = "dark_all";
        else if (type && type.indexOf("dark")  !== -1) basemap = "dark_all";
        else if (type && type.indexOf("night") !== -1) basemap = "dark_all";
        else if (type && type.indexOf("night") !== -1) basemap = "dark_all";
        else if (type && type.indexOf("light") !== -1) basemap = "light_all";
        else basemap = "light_all";

        this.model.set("basemap", basemap);

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
        self.model.set(name,value);
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
      return this._set("center", center);
    },

    format: function(format) {
      return this._set("format", _.include(this.supported_formats, format) ? format : this.model.defaults.format);
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

      this.model.set("size", [img.width, img.height]);

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
          callback(null, self._getUrl()); // TODO: return the error
        }
      });

    },

    /* Image.write(attributes)
       adds a img tag in the same place script is executed */
      // TODO: document class, id and src attributes

    write: function(attributes) {

      var self = this;

      this.model.set("attributes", attributes);

      if (attributes && attributes.src) {
        document.write('<img id="' + this.model.get("temp_id") + '" src="'  + attributes.src + '" />');
      } else {
        document.write('<img id="' + this.model.get("temp_id") + '" />');
      }

      this.queue.add(function() {

        var element = document.getElementById(self.model.get("temp_id"));

        element.src = self._getUrl();
        element.removeAttribute("temp_id");

        var attributes = self.model.get("attributes");

        if (attributes && attributes.class) { element.setAttribute("class", attributes.class); }
        if (attributes && attributes.id)    { element.setAttribute("id", attributes.id); }

      });

      return this;
    }

  })

  cdb.Image = function(data, options) {

    if (!options) options = {};

    var image = new Image();

    if (typeof data === 'string') {
      image.load(data, options);
    } else {
      image.loadLayerDefinition(data);
    }

    return image;

  };

  var ImageLoader = cdb.image.Loader = {

    queue: [],
    current: undefined,
    _script: null,
    head: null,

    loadScript: function(src) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;
      if (!ImageLoader.head) {
        ImageLoader.head = document.getElementsByTagName('head')[0];
      }
      // defer the loading because IE9 loads in the same frame the script
      // so Loader._script is null
      setTimeout(function() {
        ImageLoader.head.appendChild(script);
      }, 0);
      return script;
    },

    get: function(url, callback) {
      if (!ImageLoader._script) {
        ImageLoader.current = callback;
        ImageLoader._script = ImageLoader.loadScript(url + (~url.indexOf('?') ? '&' : '?') + 'callback=imgjson');
      } else {
        ImageLoader.queue.push([url, callback]);
      }
    },

    getPath: function(file) {
      var scripts = document.getElementsByTagName('script'),
      cartodbJsRe = /\/?cartodb[\-\._]?([\w\-\._]*)\.js\??/;
      for (i = 0, len = scripts.length; i < len; i++) {
        src = scripts[i].src;
        matches = src.match(cartodbJsRe);

        if (matches) {
          var bits = src.split('/');
          delete bits[bits.length - 1];
          return bits.join('/') + file;
        }
      }
      return null;
    },

    loadModule: function(modName) {
      var file = "cartodb.mod." + modName + (cartodb.DEBUG ? ".uncompressed.js" : ".js");
      var src = this.getPath(file);
      if (!src) {
        cartodb.log.error("can't find cartodb.js file");
      }
      ImageLoader.loadScript(src);
    }
  };

  window.imgjson = function(data) {
    ImageLoader.current && ImageLoader.current(data);
    // remove script
    ImageLoader.head.removeChild(ImageLoader._script);
    ImageLoader._script = null;
    // next element
    var a = ImageLoader.queue.shift();
    if (a) {
      ImageLoader.get(a[0], a[1]);
    }
  };
})();
