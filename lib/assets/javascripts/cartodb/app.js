//i18n
//
function _t(s) {
  return s;
}

var i18n = {
  // format('hello, {0}', 'rambo') -> "hello, rambo"
  format: function (str) {
    for(var i = 1; i < arguments.length; ++i) {
      var attrs = arguments[i];
      for(var attr in attrs) {
        str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
      }
    }
    return str;
  }
};

// return prefixUrl for all the queries to the rest api
cdb.config.prefixUrl = function() {
  return this.get('url_prefix') || '';
};

// if the prefixUrl is like http://host.com/u/o returns
// /u/o part
cdb.config.prefixUrlPathname = function() {
  var prefix = this.prefixUrl();
  if (prefix !== '') {
    try {
      var url = new URL(this.prefixUrl()).pathname;
      // remove trailing slash
      return url.replace(/\/$/, '');
    } catch(e) {
      // not an url
    }
  }
  return prefix;
};

(function() {

  // helper functions needed frmo backbone (they are not exported)
  var getValue = function(object, prop) {
    if (!(object && object[prop])) return null;
    return _.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // backbone.sync replacement to control url prefix
  Backbone.originalSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var url = options.url || getValue(model, 'url') || urlError();
    // prefix if http is not present
    var absoluteUrl = url.indexOf('http') === 0 || url.indexOf("//") === 0;
    if (!absoluteUrl) {
      options.url = cdb.config.prefixUrl() + url;
    } else {
      options.url = url;
    }
    return Backbone.originalSync(method, model, options);
  };

  // this method returns a cached version of backbone sync
  // take a look at https://github.com/teambox/backbone.memoized_sync/blob/master/backbone.memoized_sync.js
  // this is the same concept but implemented as a wrapper for ``Backbone.sync``
  // usage:
  // initialize: function() {
  //    this.sync = Backbone.cachedSync(this.user_name);
  // }
  Backbone.cachedSync = function(namespace) {

    if (!namespace) {
      throw new Error("cachedSync needs a namespace as argument");
    }

    var namespaceKey = "cdb-cache/" + namespace;

    // saves all the localstore references to the namespace
    // inside localstore. It allows to remove all the references
    // at a time
    var index = {

      // return a list of references for the namespace
      _keys: function() {
        return JSON.parse(localStorage.getItem(namespaceKey) || '{}');
      },

      // add a new reference for the namespace
      add: function(key) {
        var keys = this._keys();
        keys[key] = +new Date();
        localStorage.setItem(namespaceKey, JSON.stringify(keys));
      },

      // remove all the references for the namespace
      invalidate: function() {
        var keys = this._keys();
        _.each(keys, function(v, k) {
          localStorage.removeItem(k);
        });
        localStorage.removeItem(namespaceKey);
      }

    }

    // localstore-like cache wrapper
    var cache = {

      setItem: function(key, value) {
        localStorage.setItem(key, value);
        index.add(key);
        return this;
      },

      // this is async in case the data needs to be compressed
      getItem: function(key, callback) {
        var val = localStorage.getItem(key);
        _.defer(function() {
          callback(val);
        });
      },

      removeItem: function(key) {
        localStorage.removeItem(key);
        index.invalidate();
      }
    }

    var cached = function(method, model, options) {
      var url = options.url || getValue(model, 'url') || urlError();
      var key = namespaceKey + "/" + url;

      if (method === 'read') {
        var success = options.success;
        var cachedValue = null;

        options.success = function(resp, status, xhr) {
           // if cached value is ok
           if (cachedValue && xhr.responseText === cachedValue) {
             return;
           }
           cache.setItem(key, xhr.responseText);
           success(resp, status, xhr);
        }

        cache.getItem(key, function(val) {
          cachedValue = val;
          if (val) {
            success(JSON.parse(val), "success");
          }
        });
      } else {
        cache.removeItem(key);
      }
      return Backbone.sync(method, model, options);
    }

    // create a public function to invalidate all the namespace
    // items
    cached.invalidate = function() {
      index.invalidate();
    }

    // for testing and debugging porpuposes
    cached.cache = cache;

    return cached;
  }


})();

Backbone.syncAbort = function() {
  var self = arguments[1];
  if (self._xhr) {
    self._xhr.abort();
  }
  self._xhr = Backbone.sync.apply(this, arguments);
  self._xhr.always(function() { self._xhr = null; });
  return self._xhr;
};

Backbone.delayedSaveSync = function(sync, delay) {
  var dsync = _.debounce(sync, delay);
  return function(method, model, options) {
    if (method === 'create' || method === 'update') {
      return dsync(method, model, options);
    } else {
      return sync(method, model, options);
    }
  }
}

Backbone.saveAbort = function() {
  var self = this;
  if (this._saving && this._xhr) {
    this._xhr.abort();
  }
  this._saving = true;
  var xhr = Backbone.Model.prototype.save.apply(this, arguments);
  this._xhr = xhr;
  xhr.always(function() { self._saving = false; });
  return xhr;
};

cdb.admin = {};
cdb.common = {};
cdb.admin.dashboard = {};
cdb.forms = {};
cdb.open = {};


/**
 * track changes and sync on every model
 */
function instrumentBackbone() {
  var events = [];
  var eventMap = {}
  instrumentBackbone.events = events;

  EVENT_SET = "SET";
  EVENT_SYNC = "SYNC";
  EVENT_SAVE = "SAVE";
  EVENT_SAVE_SUCCESS = "SAVE_SUCESS";
  EVENT_FETCH = "FETCH";
  EVENT_FETCH_SUCCESS = "FETCH_SUCESS";
  EVENT_FETCH_COLLECTION = "FETCH_COLLECTION";
  EVENT_FETCH_COLLECTION_SUCCESS = "FETCH_COLLECTION_SUCCESS";
  EVENT_SYNC_COLL = "SYNC_COLL";

  function track(obj, ev, data, parentId) {
    var t, o;
    events.push(o = {
      id: events.length,
      time: Date.now(),
      ev: ev,
      obj: obj,
      data: _.clone(data),
      parentId: parentId
    });
    eventMap[o.id] = o;
    return o.id;
  }

  var coll = 0;
  // sync
  var sync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    if (model) {
      if (!model.cid) {
        model.cid = "col_" + coll;
        ++coll;
      }
      track(model.cid, model.cid.indexOf('col') != -1 ? EVENT_SYNC_COLL: EVENT_SYNC);
    }
    return sync.apply(Backbone, arguments);
  }

  // set
  var set = Backbone.Model.prototype.set;
  Backbone.Model.prototype.set = function(key, value, options) {
    var attrs, attr, val;
    if (_.isObject(key) || key == null) {
      attrs = key;
      options = value;
    } else {
      attrs = {};
      attrs[key] = value;
    }
    track(this.cid, EVENT_SET, attrs);
    return set.apply(this, arguments)
  }

  // save
  var save = Backbone.Model.prototype.save;
  Backbone.Model.prototype.save = function(key, value, options) {
      var attrs, current;

      // Handle both `("key", value)` and `({key: value})` -style calls.
      if (_.isObject(key) || key == null) {
        attrs = key;
        options = value;
      } else {
        attrs = {};
        attrs[key] = value;
      }
      options = options ? _.clone(options) : {};

      var i = track(this.cid, EVENT_SAVE, attrs);

      // If we're "wait"-ing to set changed attributes, validate early.
      if (options.wait) {
        if (!this._validate(attrs, options)) return false;
        current = _.clone(this.attributes);
      }

      // Regular saves `set` attributes before persisting to the server.
      var silentOptions = _.extend({}, options, {silent: true});
      if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
        return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      var model = this;
      var success = options.success;
      var self = this;
      options.success = function(resp, status, xhr) {
        track(self.cid, EVENT_SAVE_SUCCESS, resp, i);
        var serverAttrs = model.parse(resp, xhr);
        if (options.wait) {
          delete options.wait;
          serverAttrs = _.extend(attrs || {}, serverAttrs);
        }
        if (!model.set(serverAttrs, options)) return false;
        if (success) {
          success(model, resp);
        } else {
          model.trigger('sync', model, resp, options);
        }
      };

      // Finish configuring and sending the Ajax request.
      options.error = Backbone.wrapError(options.error, model, options);
      var method = this.isNew() ? 'create' : 'update';
      var xhr = (this.sync || Backbone.sync).call(this, method, this, options);
      if (options.wait) this.set(current, silentOptions);
      return xhr;
  };

  Backbone.Model.prototype.fetch = function(options) {
    options = options ? _.clone(options) : {};
    var model = this;
    var success = options.success;
    var i = track(this.cid, EVENT_FETCH);
    var self = this;
    options.success = function(resp, status, xhr) {
      track(self.cid, EVENT_FETCH_SUCCESS, resp, i);
      if (!model.set(model.parse(resp, xhr), options)) return false;
      if (success) success(model, resp);
    };
    options.error = Backbone.wrapError(options.error, model, options);
    return (this.sync || Backbone.sync).call(this, 'read', this, options);
  }

   Backbone.Collection.fetch = function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === undefined) options.parse = true;
      var collection = this;
      var success = options.success;
      var i = track(this, EVENT_FETCH_COLLECTION);
      options.success = function(resp, status, xhr) {
        track(this, EVENT_FETCH_COLLECTION_SUCCESS, resp, i);
        collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
        if (success) success(collection, resp);
      };
      options.error = Backbone.wrapError(options.error, collection, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
   }

  instrumentBackbone.show = function(cid) {
    var padding = 100;
    var div = d3.select(document.body)
      .append('div')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('right', 0)
      .style('bottom', 0)
      .style('z-index', 1000)
      .style('background', 'rgba(0, 0, 0, 0.85)');

  var tooltip = div.append("div")
    .style('width', 100)
    .style('height', 100)
    .style('position', 'absolute')
    .style('background', 'rgba(255, 255, 255, 0.85)')
    .style('color', 'black')
    .style("opacity", 0);

  var width = div.node().clientWidth;
  var height = div.node().clientHeight;

    var svg = div.append("svg:svg")
        .attr('width', width)
        .attr('height', height);

    var zx = d3.scale.linear()
      .domain([-width / 2, width / 2])
      .range([0, width]);

    var zy = d3.scale.linear()
      .domain([-height / 2, height / 2])
      .range([height, 0]);

    var zoom = d3.behavior.zoom()
      .x(zx)
      .y(zy)
      .scaleExtent([1, 10])

    var xAxis = d3.svg.axis()
      .scale(zx)
      .orient("bottom")
      .tickSize(-height);

    var yAxis = d3.svg.axis()
      .scale(zy)
      .orient("left")
      .ticks(5)
      .tickSize(-width);

    var ev = svg.append("g").attr("transform", 'translate(0, 0)').call(zoom);

    svg.append("g")
    .style('fill', 'none')
    .style('stoke', '#FFF')
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

     svg.append("g")
      .style('fill', 'none')
      .style('stoke', '#FFF')
          .call(yAxis);

    objEvents = events;
    if (cid) {
      var objEvents = events.filter(function(e) {
        return cid.indexOf(e.obj) !== -1
      });
    } else {
      cid = events.map(function(e) { return e.obj; });
    }


    var e =  {
      "FETCH": 0,
      "FETCH_SUCESS": 1,
      "FETCH_COLLECTION": 2,
      "FETCH_COLLECTION_SUCCESS": 3,
      "SET": 4,
      "SAVE": 5,
      "SAVE_SUCESS": 6,
      "SYNC": 7,
      "SYNC_COLL": 8
    };
    var colors = d3.scale.category10()

    var catx = d3.scale.linear()
      .domain([0, cid.length])
      .range([0, width/Object.keys(e).length])

    function x(d) { 
      return catx(cid.indexOf(d.obj)) + padding*2 + e[d.ev]*100; 
    }

    function _time(d) { return +d.time; };
    var y = d3.scale.linear()
      .domain([d3.min(objEvents, _time), d3.max(objEvents, _time)])
      .range([padding, div.node().clientHeight - padding ]);

    // lines
    var line = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("basis");

    var lines = objEvents.filter(function(e) {
      return !!e.parentId;
    });

    ev.selectAll('.line')
      .data(lines)
      .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", '#FFF')
        .attr("stroke-width", 0.2)
        .attr('d', function(d, i) {
          var p = eventMap[d.parentId];
          return line([
            {x: x(d), y: y(+d.time) },
            {x: x(p), y: y(+p.time) }
          ]);
        })

    ev.selectAll('.event')
      .data(objEvents)
      .enter()
        .append("svg:circle")
          .attr("fill", function(d) {
            console.log(d.ev);
            return colors(e[d.ev]);
          })
          .attr("r", 3)
          .attr('cx', function(d, i) {
            return x(d);
          })
          .attr('cy', function(d, i) {
            return y(d.time);
          })
          .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("<h1>" + d.ev  + " (" + d.obj + ")<br>" + (d.time - objEvents[0].time))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 48) + "px");
           })
          .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


  }
}

//instrumentBackbone();

cdb.dashboard = {};
