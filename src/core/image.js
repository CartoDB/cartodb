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

  cdb.image.Image = cdb.core.Model.extend({

    ajax: window.$ ? window.$.ajax : reqwest.compat,

    defaults: {
      width: 320,
      height: 240
    },

    initialize: function() {

      var self = this;

      this.endpoint = "http://santiago-st.cartodb-staging.com/api/v1/map";

    },

    load: function(vizjson) {

      this.set("vizjson", vizjson);

      cdb.image.Loader.get(vizjson, function(data){

        if (data) {
          self.set("zoom", data.zoom);
          self.set("center", data.center);
          self.set("bounds", data.bounds);
        }

      });

      return this;

    },

    loadLayerDefinition: function(layer_definition) {

      this.queue = new Queue;

      layer_definition = {
        "version": "1.3.0-alpha",
        "layers": [
          {
          "type": "mapnik",
          "options": {
            "sql": "select null::geometry the_geom_webmercator",
            "cartocss": "#layer {\n\tpolygon-fill: #FF3300;\n\tpolygon-opacity: 0;\n\tline-color: #333;\n\tline-width: 0;\n\tline-opacity: 0;\n}",
            "cartocss_version": "2.2.0"
          }
        }
        ]
      };

      var self = this;

      this._requestPOST(layer_definition, function(data) {

        if (data) {

          self.set("layergroupid", data.layergroupid)
          console.log(data.layergroupid);

          self.queue.flush(this);
        }

      });

    },

    _requestPOST: function(params, callback) {

      this.ajax({
        crossOrigin: true,
        type: 'POST',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        url: this.endpoint,
        data: JSON.stringify(params),
        success: function(data) {
          callback(data);
        },
        error: function(xhr) {
          callback(null);
        }
      });

    },

    _tilerHost: function() {
      var opts = this.options;
      return opts.tiler_protocol +
        "://" + ((opts.user_name) ? opts.user_name+".":"")  +
      opts.tiler_domain +
        ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
    },

    _host: function(subhost) {
      var opts = this.options;
      if (opts.no_cdn) {
        return this._tilerHost();
      } else {
        var h = opts.tiler_protocol + "://";
        if (subhost) {
          h += subhost + ".";
        }
        var cdn_host = opts.cdn_url || cdb.CDB_HOST;
        if(!cdn_host.http && !cdn_host.https) {
          throw new Error("cdn_host should contain http and/or https entries");
        }
        h += cdn_host[opts.tiler_protocol] + "/" + opts.user_name;
        return h;
      }
    },

    zoom: function(zoom) {

      var self = this;

      this.queue.add(function() {
        self.set("zoom", zoom);
      });

      return this;

    },

    center: function(center) {

      var self = this;

      this.queue.add(function() {
        self.set("center", center);
      });

      return this;

    },

    size: function(width, height) {

      var self = this;

      this.queue.add(function() {
        self.set({ width: width, height: height });
      });

      return this;

    },

    write: function() {

      var self = this;

      this.queue.add(function() {
        console.log(self.attributes);
      });

      return this;

      /*var self = this;
      if (!this.loaded) {
        cdb.image.Loader.get(this.get("vizjson"), function(data){
          console.log(data)
          self.loaded = true;

          if (data) {
            self.set("zoom", data.zoom);
            self.set("center", data.center);
            self.set("bounds", data.bounds);
          }
        });
      }*/
    }


  })

  cdb.Image = function(data) {

    var image = new cdb.image.Image();

    if (typeof data === 'string') {
      image.load(data);
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
        ImageLoader._script = ImageLoader.loadScript(url + (~url.indexOf('?') ? '&' : '?') + 'callback=vizjson2');
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

  window.vizjson2 = function(data) {
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
