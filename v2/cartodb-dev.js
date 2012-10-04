// entry point
(function() {
    var cdb = window.cdb = {};
    window.cdb.config = {};
    window.cdb.core = {};
    window.cdb.geo = {};
    window.cdb.geo.ui = {};
    window.cdb.ui = {};
    window.cdb.ui.common = {};
    window.cdb.vis = {};
    window.cdb.decorators = {};
    /**
     * global variables
     */
    window.JST = window.JST || {};

    cdb.files = [
        "../vendor/jquery.min.js",
        "../vendor/underscore-min.js",
        "../vendor/backbone.js",

        "../vendor/leaflet.js",
        "../vendor/wax.leaf.js",
        "../vendor/cartodb-leaflet.js",

        'core/decorator.js',
        'core/config.js',
        'core/log.js',
        'core/profiler.js',
        'core/template.js',
        'core/view.js',

        'geo/map.js',
        'geo/ui/zoom.js',
        'geo/ui/legend.js',
        'geo/ui/switcher.js',
        //'geo/ui/selector.js',
        'geo/ui/infowindow.js',
        'geo/ui/header.js',
        'geo/leaflet.js',

        'ui/common/dialog.js',
        'ui/common/notification.js',
        'ui/common/table.js',

        'vis/vis.js',
        'vis/overlays.js',
        'vis/layers.js'
    ];

    cdb.init = function(ready) {
      // define a simple class
      var Class = cdb.Class = function() {};
      _.extend(Class.prototype, Backbone.Events);

      cdb._loadJST();
      window.cdb.god = new Backbone.Model();

      ready && ready();
    };

    /**
     * load all the javascript files. For testing, do not use in production
     */
    cdb.load = function(prefix, ready) {
        var c = 0;

        var next = function() {
            var script = document.createElement('script');
            script.src = prefix + cdb.files[c];
            document.body.appendChild(script);
            ++c;
            if(c == cdb.files.length) {
                if(ready) {
                    script.onload = ready;
                }
            } else {
                script.onload = next;
            }
        };

        next();

    };
})();
/**
* Decorators to extend funcionality of cdb related objects
*/

/**
* Adds .super method to call for the same method of the parent class
* usage:
*   insanceOfClass.super('name_of_the_method');
*/
cdb.decorators.super = (function() {
  // we need to backup one of the backbone extend models
  // (it doesn't matter which, they are all the same method)
  var backboneExtend = Backbone.Router.extend;
  var superMethod = function(method, options) {
      var result = null;
      if (this.parent != null) {
          var currentParent = this.parent;
          // we need to change the parent of "this", because
          // since we are going to call the super method
          // in the context of "this", if the super method has
          // another call to super, we need to provide a way of
          // redirecting to the grandparent
          this.parent = this.parent.parent;
          if (currentParent.hasOwnProperty(method)) {
              result = currentParent[method].call(this, options);
          } else {
              result = currentParent.super.call(this, method, options);
          }
          this.parent = currentParent;
      }
      return result;
  }
  var extend = function(protoProps, classProps) {
      var child = backboneExtend.call(this, protoProps, classProps);

      child.prototype.parent = this.prototype;
      child.prototype.super = function(method, options) {
          if (method) {
              return superMethod.call(this, method, options);
          } else {
              return child.prototype.parent;
          }
      }
      return child;
  };
  var decorate = function(objectToDecorate) {
    objectToDecorate.extend = extend;
    objectToDecorate.prototype.super = function() {};
    objectToDecorate.prototype.parent = null;
  }
  return decorate;
})()

cdb.decorators.super(Backbone.Model);
cdb.decorators.super(Backbone.View);
cdb.decorators.super(Backbone.Collection);
/**
 * global configuration 
 */

(function() {

    Config = Backbone.Model.extend({
        VERSION: 2,

        //error track
        REPORT_ERROR_URL: '/api/v0/error',
        ERROR_TRACK_ENABLED: false

    });

    cdb.config = new Config();

})();
/**
 * logging
 */

(function() {

    // error management
    cdb.core.Error = Backbone.Model.extend({
        url: cdb.config.REPORT_ERROR_URL,
        initialize: function() {
            this.set({browser: JSON.stringify($.browser) });
        }
    });

    cdb.core.ErrorList = Backbone.Collection.extend({
        model: cdb.core.Error
    });

    /** contains all error for the application */
    cdb.errors = new cdb.core.ErrorList();

    // error tracking!
    if(cdb.config.ERROR_TRACK_ENABLED) {
        window.onerror = function(msg, url, line) {
            cdb.errors.create({
                msg: msg,
                url: url,
                line: line
            });
        };
    }


    // logging
    var _fake_console = function() {};
    _fake_console.prototype.error = function(){};
    _fake_console.prototype.log= function(){};

    //IE7 love
    if(typeof console !== "undefined") {
        _console = console;
    } else {
        _console = new _fake_console();
    }

    cdb.core.Log = Backbone.Model.extend({

        error: function() {
            _console.error.apply(_console, arguments);
            cdb.errors.create({
                msg: Array.prototype.slice.call(arguments).join('')
            });
        },

        log: function() {
            _console.log.apply(_console, arguments);
        },

        info: function() {
            _console.log.apply(_console, arguments);
        },

        debug: function() {
            _console.log.apply(_console, arguments);
        }
    });

})();

cdb.log = new cdb.core.Log({tag: 'cdb'});

// =================
// profiler
// =================

(function() {
  function Profiler() {}
  Profiler.times = {};
  Profiler.new_time = function(type, time) {
      var t = Profiler.times[type] = Profiler.times[type] || {
          max: 0,
          min: 10000000,
          avg: 0,
          total: 0,
          count: 0
      };

      t.max = Math.max(t.max, time);
      t.total += time;
      t.min = Math.min(t.min, time);
      ++t.count;
      t.avg = t.total/t.count;
      this.callbacks && this.callbacks[type] && this.callbacks[type](type, time);
  };

  Profiler.new_value = Profiler.new_time;

  Profiler.print_stats = function() {
      for(k in Profiler.times) {
          var t = Profiler.times[k];
          console.log(" === " + k + " === ");
          console.log(" max: " + t.max);
          console.log(" min: " + t.min);
          console.log(" avg: " + t.avg);
          console.log(" total: " + t.total);
      }
  };

  Profiler.get = function(type) {
      return {
          t0: null,
          start: function() { this.t0 = new Date().getTime(); },
          end: function() {
              if(this.t0 !== null) {
                  Profiler.new_time(type, this.time = new Date().getTime() - this.t0);
                  this.t0 = null;
              }
          }
      };
  };

  if(typeof(cdb) !== "undefined") {
    cdb.core.Profiler = Profiler;
  } else {
    window.Profiler = Profiler;
  }

  //mini jquery
  var $ = $ || function(id) {
      var $el = {};
      if(id.el) {
        $el.el = id.el;
      } else if(id.clientWidth) {
        $el.el = id;
      } else {
        $el.el = id[0] === '<' ? document.createElement(id.substr(1, id.length - 2)): document.getElementById(id);
      }
      $el.append = function(html) {
        html.el ?  $el.el.appendChild(html.el) : $el.el.innerHTML += html;
        return $el;
      }
      $el.attr = function(k, v) { this.el.setAttribute(k, v); return this;}
      $el.css = function(prop) {
          for(var i in prop) { $el.el.style[i] = prop[i]; }
          return $el;
      }
      $el.width = function() {  return this.el.clientWidth; };
      $el.html = function(h) { $el.el.innerHTML = h; return this; }
      return $el;
  }
  
  function CanvasGraph(w, h) {
      this.el = document.createElement('canvas');
      this.el.width = w;
      this.el.height = h;
      this.el.style.float = 'left';
      this.el.style.border = '3px solid rgba(0,0,0, 0.2)';
      this.ctx = this.el.getContext('2d');

      var barw = w;

      this.value = 0;
      this.max = 0;
      this.min = 0;
      this.pos = 0;
      this.values = [];

      this.reset = function() {
          for(var i = 0; i < barw; ++i){
              this.values[i] = 0;
          }
      }
      this.set_value = function(v) {
          this.value = v;
          this.values[this.pos] = v;
          this.pos = (this.pos + 1)%barw;

          //calculate the max
          this.max = v;
          for(var i = 0; i < barw; ++i){
            var _v = this.values[i];
            this.max = Math.max(this.max, _v);
            //this.min = Math.min(v, _v);
          }
          this.scale = this.max;
          this.render();
      }

      this.render = function() {
          this.el.width = this.el.width;
          for(var i = 0; i < barw; ++i){
              var p = barw - i - 1;
              var v = (this.pos + p)%barw;
              v = 0.9*h*this.values[v]/this.scale;
              this.ctx.fillRect(p, h - v, 1, v);
          }
      }

      this.reset();
  }

  Profiler.ui = function() {
    Profiler.callbacks = {};
    var _$ied;
    if(!_$ied){
        _$ied = $('<div>').css({
          'position': 'fixed',
          'bottom': 10,
          'left': 10,
          'zIndex': 20000,
          'width': $(document.body).width() - 80,
          'border': '1px solid #CCC',
          'padding': '10px 30px',
          'backgroundColor': '#fff',
          'fontFamily': 'helvetica neue,sans-serif',
          'fontSize': '14px',
          'lineHeight': '1.3em'
        });
        $(document.body).append(_$ied);
    }
    this.el = _$ied;
    var update = function() {
        for(k in Profiler.times) {
          var pid = '_prof_time_' + k;
          var p = $(pid);
          if(!p.el) {
            p = $('<div>').attr('id', pid)
            p.css({
              'margin': '0 0 20px 0',
              'border-bottom': '1px solid #EEE'
            });
            var t = Profiler.times[k];
            var div = $('<div>').append('<h1>' + k + '</h1>').css({
              'font-weight': 'bold',
              'margin': '10px 0 30px 0'
            })
            for(var c in t) {
              p.append(
                div.append($('<div>').append('<span style="display: inline-block; width: 60px;font-weight: 300;">' + c + '</span><span style="font-size: 21px" id="'+  k + "-" + c + '"></span>').css({ padding: '5px 0' })));
            }
            _$ied.append(p);
            var graph = new CanvasGraph(250, 100);
            p.append(graph);
            Profiler.callbacks[k] = function(k, v) {
              graph.set_value(v);
            }
          }
          // update ir
          var t = Profiler.times[k];
          for(var c in t) {
            $(k + "-" + c).html(t[c].toFixed(2));
          }
        }
    }
    setInterval(function() {
      update();
    }, 1000);
    /*var $message = $('<li>'+message+' - '+vars+'</li>').css({
        'borderBottom': '1px solid #999999'
      });
      _$ied.find('ol').append($message);
      _.delay(function() {
        $message.fadeOut(500);
      }, 2000);
    };
    */
  };

})();
/**
 * template system
 * usage:
   var tmpl = new cdb.core.Template({
     template: "hi, my name is {{ name }}",
     type: 'mustache' // undescore by default
   });
   console.log(tmpl.render({name: 'rambo'})));
   // prints "hi, my name is rambo"
  

   you could pass the compiled tempalte directly:

   var tmpl = new cdb.core.Template({
     compiled: function() { return 'my compiled template'; }
   });
 */

cdb.core.Template = Backbone.Model.extend({

  initialize: function() {
    this.bind('change', this._invalidate);
    this._invalidate();
  },

  url: function() {
    return this.get('template_url');
  },

  parse: function(data) {
    return {
      'template': data
    };
  },

  _invalidate: function() {
    this.compiled = null;
    if(this.get('template_url')) {
      this.fetch();
    }
  },

  compile: function() {
    var tmpl_type = this.get('type') || 'underscore';
    var fn = cdb.core.Template.compilers[tmpl_type];
    if(fn) {
      return fn(this.get('template'));
    } else {
      cdb.log.error("can't get rendered for " + tmpl_type);
    }
    return null;
  },

  /**
   * renders the template with specified vars
   */
  render: function(vars) {
    var c = this.compiled = this.compiled || this.get('compiled') || this.compile();
    var r = cdb.core.Profiler.get('template_render');
    r.start();
    var rendered = c(vars);
    r.end();
    return rendered;
  },

  asFunction: function() {
    return _.bind(this.render, this);
  }

}, {
  compilers: {
    'underscore': _.template,
    'mustache': typeof(Mustache) === 'undefined' ? null: Mustache.compile
  }, 
  compile: function(tmpl, type) {
    var t = new cdb.core.Template({
      template: tmpl,
      type: type || 'underscore'
    });
    return _.bind(t.render, t);
  }
}
);

cdb.core.TemplateList = Backbone.Collection.extend({

  model: cdb.core.Template,

  getTemplate: function(template_name) {
    if(this.namespace) {
      template_name = this.namespace + template_name;
    }
    var t = this.find(function(t) {
        return t.get('name') === template_name;
    });
    if(t) {
        return _.bind(t.render, t);
    }
    cdb.log.error(template_name+" not found");
    return null;
  }
});

/**
 * global variable
 */
cdb.templates = new cdb.core.TemplateList();

/**
 * load JST templates.
 * rails creates a JST variable with all the templates.
 * This functions loads them as default into cbd.template
 */
cdb._loadJST = function() {
  if(typeof(window.JST) !== undefined) {
    cdb.templates.reset(
      _(JST).map(function(tmpl, name) {
        return { name: name, compiled: tmpl };
      })
    );
  }
};

(function() {

  /** 
   * Base View for all CartoDB views.
   * DO NOT USE Backbone.View directly
   */
  var View = cdb.core.View = Backbone.View.extend({

    constructor: function(options) {
      this._models = [];
      this._subviews = {};
      Backbone.View.call(this, options);
      View.viewCount++;
      View.views[this.cid] = this;
      this._created_at = new Date();
      cdb.core.Profiler.new_value('total_views', View.viewCount);
    },

    add_related_model: function(m) {
      this._models.push(m);
    },

    addView: function(v) {
      this._subviews[v.cid] = v;
      v._parent = this;
    },

    removeView: function(v) {
      delete this._subviews[v.cid];
    },

    clearSubViews: function() {
      _(this._subviews).each(function(v) {
        v.clean();
      });
      this._subviews = {};
    },

    /**
     * this methid clean removes the view
     * and clean and events associated. call it when 
     * the view is not going to be used anymore
     */
    clean: function() {
      var self = this;
      this.trigger('clean');
      this.clearSubViews();
      // remove from parent
      if(this._parent) {
        this._parent.removeView(this);
      }
      this.remove();
      this.unbind();
      // remove model binding
      _(this._models).each(function(m) {
        m.unbind(null, null, self);
      });
      this._models = [];
      View.viewCount--;
      delete View.views[this.cid];
    },

    /**
     * utility methods
     */

    getTemplate: function(tmpl) {
      if(this.options.template) {
        return  _.template(this.options.template);
      }
      return cdb.templates.getTemplate(tmpl);
    },

    show: function() {
        this.$el.show();
    },

    hide: function() {
        this.$el.hide();
    }

  }, {
    viewCount: 0,
    views: {},

    /**
     * when a view with events is inherit and you want to add more events
     * this helper can be used:
     * var MyView = new core.View({
     *  events: cdb.core.View.extendEvents({
     *      'click': 'fn'
     *  })
     * });
     */
    extendEvents: function(newEvents) {
      return function() {
        return _.extend(newEvents, this.constructor.__super__.events);
      };
    },

    /**
     * search for views in a view and check if they are added as subviews
     */
    runChecker: function() {
      _.each(cdb.core.View.views, function(view) {
        _.each(view, function(prop, k) {
          if( k !== '_parent' && 
              view.hasOwnProperty(k) && 
              prop instanceof cdb.core.View &&
              view._subviews[prop.cid] === undefined) {
            console.log("=========");
            console.log("untracked view: ");
            console.log(prop.el);
            console.log('parent');
            console.log(view.el);
            console.log(" ");
          }
        });
      });
    }
  });

})();
/**
* Classes to manage maps
*/

/**
* Map layer, could be tiled or whatever
*/
cdb.geo.MapLayer = Backbone.Model.extend({

  defaults: {
    visible: true,
    type: 'Tiled'
  }

});

// Good old fashioned tile layer
cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
  getTileLayer: function() {
  }
});

/**
 * this layer allows to put a plain color or image as layer (instead of tiles)
 */
cdb.geo.PlainLayer = cdb.geo.MapLayer.extend({
  defaults: {
    type: 'Plain',
    color: '#FFFFFF'
  }
});

// CartoDB layer
cdb.geo.CartoDBLayer = cdb.geo.MapLayer.extend({
  defaults: {
    type: 'CartoDB',
    active: true,
    query: null,
    opacity: 0.99,
    auto_bound: false,
    interactivity: null,
    debug: false,
    visible: true,
    tiler_domain: "cartodb.com",
    tiler_port: "80",
    tiler_protocol: "http",
    sql_domain: "cartodb.com",
    sql_port: "80",
    sql_protocol: "http",
    extra_params: {},
    cdn_url: null
  },

  activate: function() {
    this.set({active: true, opacity: 0.99, visible: true})
  },

  deactivate: function() {
    this.set({active: false, opacity: 0, visible: false})
  },

  toggle: function() {
    if(this.get('active')) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
});

cdb.geo.Layers = Backbone.Collection.extend({

  model: cdb.geo.MapLayer,

  clone: function() {
    var layers = new cdb.geo.Layers();
    this.each(function(layer) {
      if(layer.clone) {
        layers.add(layer.clone());
      } else {
        layers.add(_.clone(layer.attributes));
      }
    });
    return layers;
  }
});

/**
* map model itself
*/
cdb.geo.Map = Backbone.Model.extend({

  defaults: {
    center: [0, 0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 20,
    bounding_box_sw: [0, 0],
    bounding_box_ne: [0, 0],
    provider: 'leaflet'
  },

  initialize: function() {
    this.layers = new cdb.geo.Layers();
  },

  setView: function(latlng, zoom) {
    this.set({
      center: latlng,
      zoom: zoom
    }, {
      silent: true
    });
    this.trigger("set_view");
  },

  setZoom: function(z) {
    this.set({
      zoom: z
    });
  },

  getZoom: function() {
    return this.get('zoom');
  },

  setCenter: function(latlng) {
    this.set({
      center: latlng
    });
  },

  clone: function() {
    var m = new cdb.geo.Map(_.clone(this.attributes));
    // clone lists
    m.set({
      center: _.clone(this.attributes.center),
      bounding_box_sw: _.clone(this.attributes.bounding_box_sw),
      bounding_box_ne: _.clone(this.attributes.bounding_box_ne)
    });
    // layers
    m.layers = this.layers.clone();
    return m;

  },

  /**
  * Change multiple options at the same time
  * @params {Object} New options object
  */
  setOptions: function(options) {
    if (typeof options != "object" || options.length) {
      if (this.options.debug) {
        throw (options + ' options has to be an object');
      } else {
        return;
      }
    }

    // Set options
    L.Util.setOptions(this, options);

  },

  getLayerAt: function(i) {
    return this.layers.at(i);
  },

  getLayerByCid: function(cid) {
    return this.layers.getByCid(cid);
  },

  addLayer: function(layer, opts) {
    this.layers.add(layer, opts);
    return layer.cid;
  },

  removeLayer: function(layer) {
    this.layers.remove(layer);
  },

  removeLayerByCid: function(cid) {
    var layer = this.layers.getByCid(cid);

    if (layer) this.removeLayer(layer);
    else cdb.log.error("There's no layer with cid = " + cid + ".");
  },

  removeLayerAt: function(i) {
    var layer = this.layers.at(i);

    if (layer) this.removeLayer(layer);
    else cdb.log.error("There's no layer in that position.");
  },

  clearLayers: function() {
    while (this.layers.length > 0) {
      this.removeLayer(this.layers.at(0));
    }
  },

  // by default the base layer is the layer at index 0
  getBaseLayer: function() {
    return this.layers.at(0);
  },

  // remove current base layer and set the specified
  // the base layer is not deleted, it is only removed
  // from the layer list
  // return the old one
  setBaseLayer: function(layer) {
    var old = this.layers.at(0);
    this.layers.remove(old);
    this.layers.add(layer, { at: 0 });
    return old;
  }
});


/**
* Base view for all impl
*/
cdb.geo.MapView = cdb.core.View.extend({

  initialize: function() {

    if (this.options.map === undefined) {
      throw new Exception("you should specify a map model");
    }

    this.map = this.options.map;
    this.add_related_model(this.map);
  },

  render: function() {
    return this;
  },

  /**
   * add a infowindow to the map
   */
  addInfowindow: function(infoWindowView) {
    this.$el.append(infoWindowView.render().el);
    this.addView(infoWindowView);
  },

  showBounds: function(bounds) {
    throw "to be implemented";
  }


});
/**
 * View to control the zoom of the map.
 *
 * Usage:
 *
 * var zoomControl = new cdb.geo.ui.Zoom({ model: map });
 * mapWrapper.$el.append(zoomControl.render().$el);
 *
 */


cdb.geo.ui.Zoom = cdb.core.View.extend({

  id: "zoom",

  events: {
    'click .zoom_in': 'zoom_in',
    'click .zoom_out': 'zoom_out'
  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  initialize: function() {
    this.map = this.model;

    _.defaults(this.options, this.default_options);

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');
    //TODO: bind zoom change to disable zoom+/zoom-
  },

  render: function() {
    this.$el.html(this.template(this.options));
    return this;
  },

  zoom_in: function(ev) {
    if (this.map.get("maxZoom") <= this.map.getZoom()) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.map.setZoom(this.map.getZoom() + 1);
  },

  zoom_out: function(ev) {
    if (this.map.get("minZoom") >= this.map.getZoom()) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.map.setZoom(this.map.getZoom() - 1);
  }
});
cdb.geo.ui.LegendItemModel = Backbone.Model.extend({ });

cdb.geo.ui.LegendItems = Backbone.Collection.extend({
  model: cdb.geo.ui.LegendItemModel
});

cdb.geo.ui.LegendItem = cdb.core.View.extend({

  tagName: "li",

  initialize: function() {

    _.bindAll(this, "render");
    this.template = cdb.templates.getTemplate('templates/map/legend/item');

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));
    return this.$el;

  }

});

cdb.geo.ui.Legend = cdb.core.View.extend({

  id: "legend",

  default_options: {

  },

  initialize: function() {

    this.map = this.model;

    this.add_related_model(this.model);

    _.bindAll(this, "render", "show", "hide");

    _.defaults(this.options, this.default_options);

    if (this.collection) {
      this.model.collection = this.collection;
    }

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/legend');
  },

  show: function() {
    this.$el.fadeIn(250);
  },

  hide: function() {
    this.$el.fadeOut(250);
  },

  render: function() {
    var self = this;

    if (this.model != undefined) {
      this.$el.html(this.template(this.model.toJSON()));
    }

    if (this.collection) {

      this.collection.each(function(item) {

        var view = new cdb.geo.ui.LegendItem({ className: item.get("className"), model: item });
        self.$el.find("ul").append(view.render());

      });
    }

    return this;
  }

});
cdb.geo.ui.SwitcherItemModel = Backbone.Model.extend({ });

cdb.geo.ui.SwitcherItems = Backbone.Collection.extend({
  model: cdb.geo.ui.SwitcherItemModel
});

cdb.geo.ui.SwitcherItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click a" : "select"

  },

  initialize: function() {

    _.bindAll(this, "render");
    this.template = cdb.templates.getTemplate('templates/map/switcher/item');
    this.parent = this.options.parent;
    this.model.on("change:selected", this.render);

  },

  select: function(e) {
    e.preventDefault();
    this.parent.toggle(this);
    var callback = this.model.get("callback");

    if (callback) {
      callback();
    }

  },

  render: function() {

    if (this.model.get("selected") == true) {
      this.$el.addClass("selected");
    } else {
      this.$el.removeClass("selected");
    }

    this.$el.html(this.template(this.model.toJSON()));
    return this.$el;

  }

});

cdb.geo.ui.Switcher = cdb.core.View.extend({

  id: "switcher",

  default_options: {

  },

  initialize: function() {

    this.map = this.model;

    this.add_related_model(this.model);

    _.bindAll(this, "render", "show", "hide", "toggle");

    _.defaults(this.options, this.default_options);

    if (this.collection) {
      this.model.collection = this.collection;
    }

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/switcher');
  },

  show: function() {
    this.$el.fadeIn(250);
  },

  hide: function() {
    this.$el.fadeOut(250);
  },

  toggle: function(clickedItem) {

    if (this.collection) {
      this.collection.each(function(item) {
        item.set("selected", !item.get("selected"));
      });
    }

  },

  render: function() {
    var self = this;

    if (this.model != undefined) {
      this.$el.html(this.template(this.model.toJSON()));
    }

    if (this.collection) {

      this.collection.each(function(item) {

        var view = new cdb.geo.ui.SwitcherItem({ parent: self, className: item.get("className"), model: item });
        self.$el.find("ul").append(view.render());

      });
    }

    return this;
  }

});
/** Usage:
*
* Add Infowindow model:
*
* var infowindowModel = new cdb.geo.ui.InfowindowModel({
*   template_name: 'templates/map/infowindow',
*   latlng: [72, -45],
*   offset: [100, 10]
* });
*
* var infowindow = new cdb.geo.ui.Infowindow({
*   model: infowindowModel,
*   mapView: mapView
* });
*
* Show the infowindow:
* infowindow.showInfowindow();
*
*/

cdb.geo.ui.InfowindowModel = Backbone.Model.extend({

  defaults: {
    template_name: 'geo/infowindow',
    latlng: [0, 0],
    offset: [0, 0], // offset of the tip calculated from the bottom left corner
    autoPan: true,
    content: "",
    visibility: false,
    fields: null // contains the fields displayed in the infowindow
  },

  clearFields: function() {
    this.set({fields: []});
  },

  _cloneFields: function() {
    return _(this.get('fields')).map(function(v) {
      return _.clone(v);
    });
  },

  addField: function(fieldName, at) {
    if(!this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      fields.push({name: fieldName, title: true, position: at});
      //sort fields
      fields.sort(function(a, b) {
        return a.position -  b.position;
      });
      this.set({'fields': fields});
    }
    return this;
  },

  getFieldProperty: function(fieldName, k) {
    if(this.containsField(fieldName)) {
      var fields = this.get('fields') || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      return fields[idx][k];
    }
    return null;
  },

  setFieldProperty: function(fieldName, k, v) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      fields[idx][k] = v;
      this.set({'fields': fields});
    }
    return this;
  },

  containsField: function(fieldName) {
    var fields = this.get('fields') || [];
    return _.contains(_(fields).pluck('name'), fieldName);
  },

  removeField: function(fieldName) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      if(idx >= 0) {
        fields.splice(idx, 1);
      }
      this.set({'fields': fields});
    }
    return this;
  }

});

cdb.geo.ui.Infowindow = cdb.core.View.extend({
  className: "infowindow",

  initialize: function(){
    var self = this;

    _.bindAll(this, "render", "setLatLng", "changeTemplate", "_updatePosition", "_update", "toggle", "show", "hide");

    this.mapView = this.options.mapView;
    this.map     = this.mapView.map_leaflet;

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate(this.model.get("template_name"));

    this.add_related_model(this.model);

    this.model.bind('change:content', this.render, this);
    this.model.bind('change:template_name', this.changeTemplate, this);
    this.model.bind('change:latlng', this.render, this);
    this.model.bind('change:visibility', this.toggle, this);

    this.mapView.map.bind('change', this._updatePosition, this);
    //this.map.on('viewreset', this._updatePosition, this);
    this.map.on('drag', this._updatePosition, this);
    this.map.on('zoomstart', this.hide, this);
    this.map.on('zoomend', this.show, this);

    this.map.on('click', function() {
      self.model.set("visibility", false);
    });

    this.render();
    this.$el.hide();

  },

  changeTemplate: function(template_name) {

    this.template = cdb.templates.getTemplate(this.model.get("template_name"));
    this.render();

  },

  render: function() {
    if(this.template) {
      this.$el.html($(this.template(_.clone(this.model.attributes))));
      this._update();
    }
    return this;
  },

  toggle: function() {
    this.model.get("visibility") ? this.show() : this.hide();
  },

  /**
  * Set the correct position for the popup
  * @params {latlng} A new Leaflet LatLng object
  */
  setLatLng: function (latlng) {
    this.model.set("latlng", latlng);
    return this;
  },

  showInfowindow: function() {
    this.model.set("visibility", true);
  },

  show: function () {
    var that = this;

    if (this.model.get("visibility")) {
      that.$el.css({ left: -5000 });
      that.$el.fadeIn(250, function() {
        that._update();
      });
    }

  },

  isHidden: function () {
    return !this.model.get("visibility");
  },

  hide: function (force) {
    if (force || !this.model.get("visibility")) this.$el.fadeOut(250);
  },

  _update: function () {
    this._adjustPan();
    this._updatePosition();
  },

  /**
  * Update the position (private)
  */
  _updatePosition: function () {

    var offset = this.model.get("offset");

    var
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true),
    containerWidth  = this.$el.width(),
    left            = pos.x - offset[0],
    size            = this.map.getSize(),
    bottom          = -1*(pos.y - offset[1] - size.y);

    this.$el.css({ bottom: bottom, left: left });
  },

  _adjustPan: function () {

    var offset = this.model.get("offset");

    if (!this.model.get("autoPan")) { return; }

    var
    map             = this.map,
    x               = this.$el.position().left,
    y               = this.$el.position().top,
    containerHeight = this.$el.outerHeight(true),
    containerWidth  = this.$el.width(),
    layerPos        = new L.Point(x, y),
    pos             = this.mapView.latLonToPixel(this.model.get("latlng")),
    adjustOffset    = new L.Point(0, 0),
    size            = map.getSize();

    if (pos.x - offset[0] < 0) {
      adjustOffset.x = pos.x - offset[0] - 10;
    }

    if (pos.x - offset[0] + containerWidth > size.x) {
      adjustOffset.x = pos.x + containerWidth - size.x - offset[0] + 10;
    }

    if (pos.y - containerHeight < 0) {
      adjustOffset.y = pos.y - containerHeight - 10;
    }

    if (pos.y - containerHeight > size.y) {
      adjustOffset.y = pos.y + containerHeight - size.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      map.panBy(adjustOffset);
    }
  }

});

cdb.geo.ui.Header = cdb.core.View.extend({

  className: 'header',

  initialize: function() { 
  },

  render: function() {
    this.$el.html(this.options.template(this.options));
    return this;
  }
});
/**
* leaflet implementation of a map
*/
(function() {

  var PlainLayer = L.TileLayer.extend({

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

    _redrawTile: function (tile) {
      tile.style['background-color'] = this.options.color;
    },

    _createTileProto: function () {
        var proto = this._divProto = L.DomUtil.create('div', 'leaflet-tile leaflet-tile-loaded');
        var tileSize = this.options.tileSize;
        proto.style.width = tileSize + 'px';
        proto.style.height = tileSize + 'px';

    },

    _loadTile: function (tile, tilePoint, zoom) {
    },

    _createTile: function () {
        var tile = this._divProto.cloneNode(false);
        //set options here
        tile.onselectstart = tile.onmousemove = L.Util.falseFn;
        this._redrawTile(tile);
        return tile;
    }

  });

  /**
  * base layer for all leaflet layers
  */
  var LeafLetLayerView = function(layerModel, leafletLayer, leafletMap) {
    this.leafletLayer = leafletLayer;
    this.leafletMap = leafletMap;
    this.model = layerModel;
    this.model.bind('change', this._update, this);
  };

  _.extend(LeafLetLayerView.prototype, Backbone.Events);
  _.extend(LeafLetLayerView.prototype, {

    /**
    * remove layer from the map and unbind events
    */
    remove: function() {
      this.leafletMap.removeLayer(this.leafletLayer);
      this.model.unbind(null, null, this);
      this.unbind();
    }

  });

  // -- plain layer view
  var LeafLetPlainLayerView = function(layerModel, leafletMap) {
    var leafletLayer = new PlainLayer(layerModel.attributes);
    LeafLetLayerView.call(this, layerModel, leafletLayer, leafletMap);
  };
  _.extend(LeafLetPlainLayerView.prototype, LeafLetLayerView.prototype, {
    _update: function() {
    }
  });
  cdb.geo.LeafLetPlainLayerView = LeafLetPlainLayerView;

  // -- tiled layer view

  var LeafLetTiledLayerView = function(layerModel, leafletMap) {
    var leafletLayer = new L.TileLayer(layerModel.get('urlTemplate'));
    LeafLetLayerView.call(this, layerModel, leafletLayer, leafletMap);
  };

  _.extend(LeafLetTiledLayerView.prototype, LeafLetLayerView.prototype, {
    _update: function() {
      _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
      this.leafletLayer.setUrl(this.model.get('urlTemplate'));
    }
  });

  cdb.geo.LeafLetTiledLayerView = LeafLetTiledLayerView;

  /**
  * leatlet cartodb layer
  */

  var LeafLetLayerCartoDBView = function(layerModel, leafletMap) {
    var self = this;

    _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

    var opts = _.clone(layerModel.attributes);

    opts.map =  leafletMap;

    var // preserve the user's callbacks
    _featureOver  = opts.featureOver,
    _featureOut   = opts.featureOut,
    _featureClick = opts.featureClick;

    opts.featureOver  = function() {
      _featureOver  && _featureOver.apply(this, arguments);
      self.featureOver  && self.featureOver.apply(this, arguments);
    };

    opts.featureOut  = function() {
      _featureOut  && _featureOut.apply(this, arguments);
      self.featureOut  && self.featureOut.apply(this, arguments);
    };

    opts.featureClick  = function() {
      _featureClick  && _featureClick.apply(this, arguments);
      self.featureClick  && self.featureClick.apply(opts, arguments);
    };

    leafletLayer = new L.CartoDBLayer(opts);
    LeafLetLayerView.call(this, layerModel, leafletLayer, leafletMap);
  };


  _.extend(LeafLetLayerCartoDBView.prototype, LeafLetLayerView.prototype, {

    _update: function() {
      this.leafletLayer.setOptions(_.clone(this.model.attributes));
    },

    featureOver: function(e, latlon, pixelPos, data) {
      // dont pass leaflet lat/lon
      this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data);
    },

    featureOut: function(e) {
      this.trigger('featureOut', e);
    },

    featureClick: function(e, latlon, pixelPos, data) {
      // dont pass leaflet lat/lon
      this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data);
    }

  });

  cdb.geo.LeafLetLayerCartoDBView = LeafLetLayerCartoDBView;

  /**
  * leatlef impl
  */
  cdb.geo.LeafletMapView = cdb.geo.MapView.extend({

    initialize: function() {

      _.bindAll(this, '_addLayer', '_removeLayer', '_setZoom', '_setCenter', '_setView');

      cdb.geo.MapView.prototype.initialize.call(this);

      var self = this;

      var center = this.map.get('center');

      this.map_leaflet = new L.Map(this.el, {
        zoomControl: false,
        center: new L.LatLng(center[0], center[1]),
        zoom: this.map.get('zoom'),
        minZoom: this.map.get('minZoom'),
        maxZoom: this.map.get('maxZoom'),
        maxBounds: [this.map.get('bounding_box_ne'), this.map.get('bounding_box_sw')]
      });
      this.layerTypeMap = {
        "tiled": cdb.geo.LeafLetTiledLayerView,
        "cartodb": cdb.geo.LeafLetLayerCartoDBView,
        "plain": cdb.geo.LeafLetPlainLayerView
      };

      // this var stores views information for each model
      this.layers = {};

      this.map.bind('set_view', this._setView, this);
      this.map.layers.bind('add', this._addLayer, this);
      this.map.layers.bind('remove', this._removeLayer, this);
      this.map.layers.bind('reset', this._addLayers, this);

      this._bindModel();

      this._addLayers();

      this.map_leaflet.on('layeradd', function(lyr) {
        this.trigger('layeradd', lyr, self);
      }, this);

      this.map_leaflet.on('zoomend', function() {
        self._setModelProperty({
          zoom: self.map_leaflet.getZoom()
        });
      }, this);

      this.map_leaflet.on('move', function() {
        var c = self.map_leaflet.getCenter();
        self._setModelProperty({ center: [c.lat, c.lng] });
      });

      this.map_leaflet.on('drag', function() {
        var c = self.map_leaflet.getCenter();
        self._setModelProperty({
          center: [c.lat, c.lng]
        });
      }, this);

    },

    /** bind model properties */
    _bindModel: function() {
      this.map.bind('change:zoom',   this._setZoom, this);
      this.map.bind('change:center', this._setCenter, this);
    },

    /** unbind model properties */
    _unbindModel: function() {
      this.map.unbind('change:zoom',   this._setZoom, this);
      this.map.unbind('change:center', this._setCenter, this);
    },

    /**
    * set model property but unbind changes first in order to not create an infinite loop
    */
    _setModelProperty: function(prop) {
      this._unbindModel();
      this.map.set(prop);
      this._bindModel();
    },

    _setZoom: function(model, z) {
      this.map_leaflet.setZoom(z);
    },

    _setCenter: function(model, center) {
      this.map_leaflet.panTo(new L.LatLng(center[0], center[1]));
    },

    /**
    * Adds interactivity to a layer
    *
    * @params {String} tileJSON
    * @params {String} featureOver
    * @return {String} featureOut
    */
    addInteraction: function(tileJSON, featureOver, featureOut) {

      return wax.leaf.interaction().map(this.map_leaflet).tilejson(tileJSON).on('on', featureOver).on('off', featureOut);

    },

    getLayerByCid: function(cid) {
      var l = this.layers[cid];
      if(!l) {
        cdb.log.error("layer with cid " + cid + " can't be get");
      }
      return l;
    },

    _removeLayer: function(layer) {
      //this.map_leaflet.removeLayer(layer.lyr);
      this.layers[layer.cid].remove();
      delete this.layers[layer.cid];
    },

    _setView: function() {
      this.map_leaflet.setView(this.map.get("center"), this.map.get("zoom"));
    },


    _addLayers: function() {
      var self = this;
      this.map.layers.each(function(lyr) {
        self._addLayer(lyr);
      });
    },

    _addLayer: function(layer, layers, opts) {
      var lyr, layer_view;

      var layerClass = this.layerTypeMap[layer.get('type').toLowerCase()];

      if (layerClass) {
        layer_view = new layerClass(layer, this.map_leaflet);
      } else {
        cdb.log.error("MAP: " + layer.get('type') + " can't be created");
      }

      this.layers[layer.cid] = layer_view;

      if (layer_view) {
        var isBaseLayer = this.layers.length === 1 || (opts && opts.index === 0);
        this.map_leaflet.addLayer(layer_view.leafletLayer, isBaseLayer);
        this.trigger('newLayerView', layer_view, this);
      } else {
        cdb.log.error("layer type not supported");
      }
    },

    latLonToPixel: function(latlon) {
      var point = this.map_leaflet.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]));
      return this.map_leaflet.layerPointToContainerPoint(point);
    },

    // return the current bounds of the map view
    getBounds: function() {
      var b = this.map_leaflet.getBounds();
      var sw = b.getSouthWest();
      var ne = b.getNorthEast();
      return [
        [sw.lat, sw.lng],
        [ne.lat, ne.lng]
      ];
    },

    showBounds: function(bounds) {
      var sw = bounds[0];
      var ne = bounds[1];
      var southWest = new L.LatLng(sw[0], sw[1]);
      var northEast = new L.LatLng(ne[0], ne[1]);
      this.map_leaflet.fitBounds(new L.LatLngBounds(southWest, northEast));
    }

  });

})();
/**
 * generic dialog
 *
 * this opens a dialog in the middle of the screen rendering
 * a dialog using cdb.templates 'common/dialog' or template_base option.
 *
 * inherit class should implement render_content (it could return another widget)
 *
 * usage example:
 *
 *    var MyDialog = cdb.ui.common.Dialog.extend({
 *      render_content: function() {
 *        return "my content";
 *      },
 *    })
 *    var dialog = new MyDialog({
 *        title: 'test',
 *        description: 'long description here',
 *        template_base: $('#base_template').html(),
 *        width: 500
 *    });
 *
 *    $('body').append(dialog.render().el);
 *    dialog.open();
 *
 * TODO: implement draggable
 * TODO: modal
 * TODO: document modal_type
 */

cdb.ui.common.Dialog = cdb.core.View.extend({

  tagName: 'div',
  className: 'dialog',

  events: {
    'click .ok': '_ok',
    'click .cancel': '_cancel',
    'click .close': '_cancel'
  },

  default_options: {
    title: 'title',
    description: '',
    ok_title: 'Ok',
    cancel_title: 'Cancel',
    width: 300,
    height: 200,
    clean_on_hide: false,
    template_name: 'common/views/dialog_base',
    ok_button_classes: 'button green',
    cancel_button_classes: '',
    modal_type: '',
    modal_class: '',
    include_footer: true
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

    _.bindAll(this, 'render', '_keydown');

    $(document).bind('keydown', this._keydown);

    this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);
  },

  render: function() {
    var $el = this.$el;

    $el.html(this.template_base(this.options));

    $el.find(".modal").css({
      width: this.options.width
      //height: this.options.height
      //'margin-left': -this.options.width>>1,
      //'margin-top': -this.options.height>>1
    });

    if(this.render_content) {

      this.$('.content').append(this.render_content());
    }

    if(this.options.modal_class) {
      this.$el.addClass(this.options.modal_class);
    }

    return this;
  },


  _keydown: function(e) {
    if (e.keyCode === 27) { 
      this._cancel();
    }
  },

  /**
   * helper method that renders the dialog and appends it to body
   */
  appendToBody: function() {
    $('body').append(this.render().el);
    return this;
  },

  _ok: function(ev) {

   if(ev) ev.preventDefault();

    if (this.ok) {
      this.ok();
    }

    this.hide();

  },

  _cancel: function(ev) {

    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (this.cancel) {
      this.cancel();
    }

    this.hide();

  },

  hide: function() {

    this.$el.hide();

    if (this.options.clean_on_hide) {
      this.clean();
    }

  },

  open: function() {

    this.$el.show();

  }

});
/**
 * generic embbed notification, like twitter "new notifications"
 *
 * it shows slowly the notification with a message and a close button.
 * Optionally you can set a timeout to close
 *
 * usage example:
 *
      var notification = new cdb.ui.common.Notificaiton({
          el: "#notification_element",
          msg: "error!",
          timeout: 1000
      });
      notification.show();
      // close it
      notification.close();
*/

cdb.ui.common.Notification = cdb.core.View.extend({

  tagName: 'div',
  className: 'dialog',

  events: {
    'click .close': 'hide'
  },

  default_options: {
      timeout: 0,
      msg: ''
  },

  initialize: function() {
    this.closeTimeout = -1;
    _.defaults(this.options, this.default_options);
    this.template = this.options.template ? _.template(this.options.template) : cdb.templates.getTemplate('common/notification');
    this.$el.hide();
  },

  render: function() {
    var $el = this.$el;
    $el.html(this.template(this.options));
    if(this.render_content) {
      this.$('.content').append(this.render_content());
    }
    return this;
  },

  hide: function(ev) {
    if (ev)
      ev.preventDefault();
    
    clearTimeout(this.closeTimeout);
    this.$el.hide();
    this.remove();
  },

  open: function() {
    this.render();
    this.$el.show();
    if(this.options.timeout) {
        this.closeTimeout = setTimeout(_.bind(this.hide, this), this.options.timeout);
    }
  }

});
/**
 * generic table
 *
 * this class creates a HTML table based on Table model (see below) and modify it based on model changes
 *
 * usage example:
 *
      var table = new Table({
          model: table
      });

      $('body').append(table.render().el);

  * model should be a collection of Rows

 */

/**
 * represents a table row
 */
cdb.ui.common.Row = Backbone.Model.extend({
});

cdb.ui.common.TableData = Backbone.Collection.extend({
    model: cdb.ui.common.Row,

    /**
     * get value for row index and columnName
     */
    getCell: function(index, columnName) {
      var r = this.at(index);
      if(!r) {
        return null;
      }
      return r.get(columnName);
    }

});

/**
 * contains information about the table, mainly the schema
 */
cdb.ui.common.TableProperties = Backbone.Model.extend({

  columnNames: function() {
    return _.map(this.get('schema'), function(c) {
      return c[0];
    });
  },

  columnName: function(idx) {
    return this.columnNames()[idx];
  }
});

/**
 * renders a table row
 */
cdb.ui.common.RowView = cdb.core.View.extend({
  tagName: 'tr',

  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.clean, this);
    this.model.bind('remove', this.clean, this);
    this.add_related_model(this.model);
    this.order = this.options.order;
  },

  valueView: function(colName, value) {
    return value;
  },

  render: function() {
    var self = this;
    var tr = this.$el;
    tr.html('');
    var row = this.model;
    tr.attr('id', 'row_' + row.id);

    var tdIndex = 0;
    if(this.options.row_header) {
        var td = $('<td>');
        td.append(self.valueView('', ''));
        td.attr('data-x', tdIndex);
        tdIndex++;
        tr.append(td);
    }

    var attrs = this.order || _.keys(row.attributes);
    _(attrs).each(function(key) {
      var value = row.attributes[key];
      if(value !== undefined) {
        var td = $('<td>');
        td.attr('id', 'cell_' + row.id + '_' + key);
        td.attr('data-x', tdIndex);
        tdIndex++;
        td.append(self.valueView(key, value));
        tr.append(td);
      }
    });
    return this;
  },

  getCell: function(x) {
    var childNo = x;
    if(this.options.row_header) {
      ++x;
    }
    return this.$('td:eq(' + x + ')');
  },

  getTableView: function() {
    return this.tableView;
  }

});

/**
 * render a table
 * this widget needs two data sources
 * - the table model which contains information about the table (columns and so on). See TableProperties
 * - the model with the data itself (TableData)
 */
cdb.ui.common.Table = cdb.core.View.extend({

  tagName: 'table',
  rowView: cdb.ui.common.RowView,

  events: {
      'click td': '_cellClick'
  },

  default_options: {
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);
    this.dataModel = this.options.dataModel;
    this.rowViews = [];

    // binding
    this.setDataSource(this.dataModel);
    this.model.bind('change', this.render, this);
    this.model.bind('change:dataSource', this.setDataSource, this);

    // assert the rows are removed when table is removed
    this.bind('clean', this.clear_rows, this);

    // prepare for cleaning
    this.add_related_model(this.dataModel);
    this.add_related_model(this.model);
  },

  headerView: function(column) {
      return column[0];
  },

  setDataSource: function(dm) {
    if(this.dataModel) {
      this.dataModel.unbind(null, null, this);
    }
    this.dataModel = dm;
    this.dataModel.bind('reset', this._renderRows, this);
    this.dataModel.bind('add', this.addRow, this);
  },

  _renderHeader: function() {
    var self = this;
    var thead = $("<thead>");
    var tr = $("<tr>");
    if(this.options.row_header) {
      tr.append($("<th>").append(self.headerView(['', 'header'])));
    }
    _(this.model.get('schema')).each(function(col) {
      tr.append($("<th>").append(self.headerView(col)));
    });
    thead.append(tr);
    return thead;
  },

  /**
   * remove all rows
   */
  clear_rows: function() {
    while(this.rowViews.length) {
      // each element removes itself from rowViews
      this.rowViews[0].clean();
    }
    this.rowViews = [];
  },

  /**
   * add rows
   */
  addRow: function(row, collection, options) {
    var self = this;
    var tr = new self.rowView({
      model: row,
      order: this.model.columnNames(),
      row_header: this.options.row_header
    });
    tr.tableView = this;

    tr.bind('clean', function() {
      var idx = _.indexOf(self.rowViews,this);
      self.rowViews.splice(idx, 1);
      // update index
      for(var i = idx; i < self.rowViews.length; ++i) {
        self.rowViews[i].$el.attr('data-y', i);
      }
    });

    tr.render();
    if(options && options.index !== undefined && options.index != self.rowViews.length) {

      tr.$el.insertBefore(self.rowViews[options.index].$el);
      self.rowViews.splice(options.index, 0, tr);
      //tr.$el.attr('data-y', options.index);
      // change others view data-y attribute
      for(var i = options.index; i < self.rowViews.length; ++i) {
        self.rowViews[i].$el.attr('data-y', i);
      }
    } else {
      // at the end
      tr.$el.attr('data-y', self.rowViews.length);
      self.$el.append(tr.el);
      self.rowViews.push(tr);
    }
  },

  /**
   * render only data rows
   */
  _renderRows: function() {
    var self = this;
    this.clear_rows();
    this.dataModel.each(function(row) {
      self.addRow(row);
    });
  },

  /**
   * render table
   */
  render: function() {
    var self = this;

    self.$el.html('');

    // render header
    self.$el.append(self._renderHeader());

    // render data
    self._renderRows();

    return this;

  },

  /**
   * return jquery cell element of cell x,y
   */
  getCell: function(x, y) {
    if(this.options.row_header) {
      ++y;
    }
    return this.rowViews[y].getCell(x);
  },

  _cellClick: function(e) {
    e.preventDefault();
    var cell = $(e.currentTarget || e.target);
    var x = parseInt(cell.attr('data-x'), 10);
    var y = parseInt(cell.parent().attr('data-y'), 10);
    this.trigger('cellClick', e, cell, x, y);
  }


});
/**
 * defines the container for an overlay.
 * It places the overlay
 */
var Overlay = {

  _types: {},

  // register a type to be created
  register: function(type, creatorFn) {
    Overlay._types[type] = creatorFn;
  },

  // create a type given the data
  // raise an exception if the type does not exist
  create: function(type, vis, data) {
    var t = Overlay._types[type];
    if(!t) {
      cdb.log.error("Overlay: " + type + " does not exist");
    }
    var widget = t(data, vis);
    return widget;
  }
};

cdb.vis.Overlay = Overlay;

// layer factory
var Layers = {

  _types: {},

  register: function(type, creatorFn) {
    this._types[type] = creatorFn;
  },

  create: function(type, vis, data) {
    if(!type) {
      cdb.log.error("creating a layer without type");
      return null;
    }
    var t = this._types[type.toLowerCase()];
    return new t(vis, data);
  }

};

cdb.vis.Layers = Layers;

/**
 * visulization creation
 */
var Vis = cdb.core.View.extend({

  initialize: function() {
  },

  load: function(data) {
    // map
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);
    data.bounding_box_sw || (data.bounding_box_sw = [0,0]);
    data.bounding_box_ne || (data.bounding_box_ne= [0,0]);
    var map = new cdb.geo.Map({
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      bounding_box_sw: data.bounding_box_sw,
      bounding_box_ne: data.bounding_box_ne
    });
    var div = $('<div>').css({
      width: '100%',
      height: '100%'
    });
    this.$el.append(div);
    var mapView = new cdb.geo.LeafletMapView({
      el: div,
      map: map
    });
    this.map = map;
    this.mapView = mapView;


    // overlays
    for(var i in data.overlays) {
      var overlay = data.overlays[i];
      overlay.map = map;
      var v = Overlay.create(overlay.type, this, overlay);
      this.addView(v);
      this.mapView.$el.append(v.el);
    }

    // layers
    for(var i in data.layers) {
      var layerData = data.layers[i];
      var layer_cid = map.addLayer(Layers.create(layerData.type, this, layerData));

      // add the associated overlays
      if(layerData.type.toLowerCase() == 'cartodb' && layerData.infowindow) {
          var infowindow = Overlay.create('infowindow', this, layerData.infowindow, true);
          mapView.addInfowindow(infowindow);
          var dataLayer = mapView.getLayerByCid(layer_cid);
          dataLayer.cid = layer_cid;
          dataLayer.bind('featureClick', function(e, latlng, pos, interact_data) {
            // prepare data
            var layer = map.layers.getByCid(this.cid);
            // infoWindow only shows if the layer is active
            if(layer.get('active')) {
              var render_fields= [];
              var fields = layer.get('infowindow').fields;
              for(var j = 0; j < fields.length; ++j) {
                var f = fields[j];
                render_fields.push({
                  title: f.title ? f.name: null,
                  value: interact_data[f.name]
                });
              }
              infowindow.model.set({ content:  { fields: render_fields } });
              infowindow.setLatLng(latlng).showInfowindow();
            }
          });
      }
    }

    if(data.bounds) {
      mapView.showBounds(data.bounds);
    } else {
      map.setCenter(data.center || [0, 0]);
      map.setZoom(data.zoom || 4);
    }
  },

});

cdb.vis.Vis = Vis;

// map zoom control
cdb.vis.Overlay.register('zoom', function(data) {

  var zoom = new cdb.geo.ui.Zoom({
    model: data.map,
    template: cdb.core.Template.compile(data.template)
  });

  return zoom.render();
});


// header to show informtion (title and description)
cdb.vis.Overlay.register('header', function(data) {

  var template = cdb.core.Template.compile( 
    data.template || "{{#title}}<h1>{{title}}</h1>{{/title}} {{#description}}<p>{{description}}</p>{{/description}}",
    'mustache'
  );

  var header = new cdb.geo.ui.Header({
    title: data.map.get('title'),
    description: data.map.get('description'),
    template: template
  });

  return header.render();
});

// infowindow
cdb.vis.Overlay.register('infowindow', function(data, vis) {

  var infowindowModel = new cdb.geo.ui.InfowindowModel({
    fields: data.fields
  });

  var infowindow = new cdb.geo.ui.Infowindow({
     model: infowindowModel,
     mapView: vis.mapView,
     template: new cdb.core.Template({ template: data.template, type: 'mustache' }).asFunction()
  });

  return infowindow;

});

Layers.register('tilejson', function(vis, data) {
  return new cdb.geo.TileLayer({urlTemplate: data.tiles[0]});
});

Layers.register('cartodb', function(vis, data) {

  if(data.infowindow && data.infowindow.fields) {
    var names = [];
    var fields = data.infowindow.fields;
    for(var i = 0; i < fields.length; ++i) {
      names.push(fields[i].name);
    }
    data.interactivity?
     data.interactivity = data.interactivity + ',' + names.join(','):
     data.interactivity = names.join(',');
  }

  return new cdb.geo.CartoDBLayer(data);
});
