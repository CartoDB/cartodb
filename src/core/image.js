(function() {

  cdb.image.Image = cdb.core.Model.extend({

    defaults: {
      width: 320,
      height: 240
    },

    initialize: function() {

      var self = this;

      cdb.image.Loader.get(this.get("url"), function(data){
        console.log(data)
        if (data) {
          self.set("zoom", data.zoom);
          self.set("center", data.center);
          self.set("bounds", data.bounds);
        }
      });

      return this;

    },

    zoom: function(zoom) {
      this.set("zoom", zoom);
      return this;
    },

    center: function(center) {
      this.set("center", center);
      return this;
    },

    size: function(width, height) {
      this.set({ width: width, height: height });
      return this;
    },

    write: function() {
      var self = this;
      if (!this.loaded) {
        cdb.image.Loader.get(this.get("url"), function(data){
          console.log(data)
          self.loaded = true;

          if (data) {
            self.set("zoom", data.zoom);
            self.set("center", data.center);
            self.set("bounds", data.bounds);

          }
        });
      }
      //debugger;
    }


  })

  cdb.Image = function(url) {
    return new cdb.image.Image({ url: url });
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
