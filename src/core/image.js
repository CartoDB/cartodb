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

    Map.call(this, this); 

    this.model = new ImageModel();
    this.error = null;

    this.supported_formats = ["png", "jpg"];

    this.defaults = {
      tiler_domain: "cartodb.com",
      tiler_port: "80"
    };

    this.available_basemaps = ["light_all", "light_nolabels", "dark_all", "dark_nolabels"];

  };

  Image.prototype = _.extend({}, Map.prototype, {

    load: function(vizjson, options) {

      _.bindAll(this, "_onVisLoaded");

      this.queue = new Queue;

      options = _.defaults(options, { vizjson: vizjson, temp_id: "s" + this._getUUID() }, this.model.defaults);

      this.model.set(options);

      cdb.vis.Loader.get(vizjson, this._onVisLoaded);

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

      this._requestLayerGroupID();

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

        var bbox = [];

        bbox.push([data.bounds[0][1], data.bounds[0][0]]);
        bbox.push([data.bounds[1][1], data.bounds[1][0]]);

        this.model.set({
          zoom: data.zoom,
          center: JSON.parse(data.center),
          bbox: bbox,
          bounds: data.bounds
        });

        if (dataLayer.type === "namedmap") {
          this.options.layers = this._getNamedmapLayerDefinition(dataLayer.options);
        } else {
          this.options.layers = this._getLayergroupLayerDefinition(dataLayer.options);
        }

        this._requestLayerGroupID();

      }

    },

    toJSON: function(){
      return this.options.layers;
    },

    _requestLayerGroupID: function() {

      var self = this;

      this._requestPOST({}, function(data, error) {

        if (error) {
          self.error = error;
        }

        if (data) {
          self.model.set("layergroupid", data.layergroupid);
        }

        self.queue.flush(this);

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
      for (var i = 0; i<ld.layers.length; i++) {
        delete ld.layers[i].options.interactivity
      }

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
        return [url, "static/bbox" , layergroupid, bbox.join(","), width, height + "." + format].join("/");
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
        else if (type && type.indexOf("blue") !== -1) basemap = "dark_all";
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
      this._set("bbox", null);
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
          callback(self.error, self._getUrl()); // TODO: return the error
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

})();
