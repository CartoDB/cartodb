var Loader = cdb.vis.Loader = cdb.core.Loader = {

  queue: [],
  current: undefined,
  _script: null,
  head: null,

  loadScript: function(src) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;
      if (!Loader.head) {
        Loader.head = document.getElementsByTagName('head')[0];
      }
      // defer the loading because IE9 loads in the same frame the script
      // so Loader._script is null
      setTimeout(function() {
        Loader.head.appendChild(script);
      }, 0);
      return script;
  },

  get: function(url, callback) {
    if (!Loader._script) {
      Loader.current = callback;
      Loader._script = Loader.loadScript(url + (~url.indexOf('?') ? '&' : '?') + 'callback=vizjson');
    } else {
      Loader.queue.push([url, callback]);
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
    Loader.loadScript(src);
  }
};

window.vizjson = function(data) {
  Loader.current && Loader.current(data);
  // remove script
  Loader.head.removeChild(Loader._script);
  Loader._script = null;
  // next element
  var a = Loader.queue.shift();
  if (a) {
    Loader.get(a[0], a[1]);
  }
};

