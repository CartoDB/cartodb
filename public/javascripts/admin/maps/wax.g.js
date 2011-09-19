/* wax - 3.0.7 - 1.0.4-396-g837ea07 */


/*!
  * Reqwest! A general purpose XHR connection manager
  * copyright Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function(context,win){function serial(a){var b=a.name;if(a.disabled||!b)return"";b=enc(b);switch(a.tagName.toLowerCase()){case"input":switch(a.type){case"reset":case"button":case"image":case"file":return"";case"checkbox":case"radio":return a.checked?b+"="+(a.value?enc(a.value):!0)+"&":"";default:return b+"="+(a.value?enc(a.value):"")+"&"}break;case"textarea":return b+"="+enc(a.value)+"&";case"select":return b+"="+enc(a.options[a.selectedIndex].value)+"&"}return""}function enc(a){return encodeURIComponent(a)}function reqwest(a,b){return new Reqwest(a,b)}function init(o,fn){function error(a){o.error&&o.error(a),complete(a)}function success(resp){o.timeout&&clearTimeout(self.timeout)&&(self.timeout=null);var r=resp.responseText;if(r)switch(type){case"json":resp=win.JSON?win.JSON.parse(r):eval("("+r+")");break;case"js":resp=eval(r);break;case"html":resp=r}fn(resp),o.success&&o.success(resp),complete(resp)}function complete(a){o.complete&&o.complete(a)}this.url=typeof o=="string"?o:o.url,this.timeout=null;var type=o.type||setType(this.url),self=this;fn=fn||function(){},o.timeout&&(this.timeout=setTimeout(function(){self.abort(),error()},o.timeout)),this.request=getRequest(o,success,error)}function setType(a){if(/\.json$/.test(a))return"json";if(/\.jsonp$/.test(a))return"jsonp";if(/\.js$/.test(a))return"js";if(/\.html?$/.test(a))return"html";if(/\.xml$/.test(a))return"xml";return"js"}function Reqwest(a,b){this.o=a,this.fn=b,init.apply(this,arguments)}function getRequest(a,b,c){if(a.type!="jsonp"){var f=xhr();f.open(a.method||"GET",typeof a=="string"?a:a.url,!0),setHeaders(f,a),f.onreadystatechange=handleReadyState(f,b,c),a.before&&a.before(f),f.send(a.data||null);return f}var d=doc.createElement("script"),e=0;win[getCallbackName(a)]=generalCallback,d.type="text/javascript",d.src=a.url,d.async=!0,d.onload=d.onreadystatechange=function(){if(d[readyState]&&d[readyState]!=="complete"&&d[readyState]!=="loaded"||e)return!1;d.onload=d.onreadystatechange=null,a.success&&a.success(lastValue),lastValue=undefined,head.removeChild(d),e=1},head.appendChild(d)}function generalCallback(a){lastValue=a}function getCallbackName(a){var b=a.jsonpCallback||"callback";if(a.url.slice(-(b.length+2))==b+"=?"){var c="reqwest_"+uniqid++;a.url=a.url.substr(0,a.url.length-1)+c;return c}var d=new RegExp(b+"=([\\w]+)");return a.url.match(d)[1]}function setHeaders(a,b){var c=b.headers||{};c.Accept=c.Accept||"text/javascript, text/html, application/xml, text/xml, */*",b.crossOrigin||(c["X-Requested-With"]=c["X-Requested-With"]||"XMLHttpRequest"),c[contentType]=c[contentType]||"application/x-www-form-urlencoded";for(var d in c)c.hasOwnProperty(d)&&a.setRequestHeader(d,c[d],!1)}function handleReadyState(a,b,c){return function(){a&&a[readyState]==4&&(twoHundo.test(a.status)?b(a):c(a))}}var twoHundo=/^20\d$/,doc=document,byTag="getElementsByTagName",readyState="readyState",contentType="Content-Type",head=doc[byTag]("head")[0],uniqid=0,lastValue,xhr="XMLHttpRequest"in win?function(){return new XMLHttpRequest}:function(){return new ActiveXObject("Microsoft.XMLHTTP")};Reqwest.prototype={abort:function(){this.request.abort()},retry:function(){init.call(this,this.o,this.fn)}},reqwest.serialize=function(a){var b=[a[byTag]("input"),a[byTag]("select"),a[byTag]("textarea")],c=[],d,e;for(d=0,l=b.length;d<l;++d)for(e=0,l2=b[d].length;e<l2;++e)c.push(serial(b[d][e]));return c.join("").replace(/&$/,"")},reqwest.serializeArray=function(a){for(var b=this.serialize(a).split("&"),c=0,d=b.length,e=[],f;c<d;c++)b[c]&&(f=b[c].split("="))&&e.push({name:f[0],value:f[1]});return e};var old=context.reqwest;reqwest.noConflict=function(){context.reqwest=old;return this},typeof module!="undefined"?module.exports=reqwest:context.reqwest=reqwest}(this,window)// Instantiate objects based on a JSON "record". The record must be a statement
// array in the following form:
//
//     [ "{verb} {subject}", arg0, arg1, arg2, ... argn ]
//
// Each record is processed from a passed `context` which starts from the
// global (ie. `window`) context if unspecified.
//
// - `@literal` Evaluate `subject` and return its value as a scalar. Useful for
//   referencing API constants, object properties or other values.
// - `@new` Call `subject` as a constructor with args `arg0 - argn`. The
//   newly created object will be the new context.
// - `@call` Call `subject` as a function with args `arg0 - argn` in the
//   global namespace. The return value will be the new context.
// - `@chain` Call `subject` as a method of the current context with args `arg0
//   - argn`. The return value will be the new context.
// - `@inject` Call `subject` as a method of the current context with args
//   `arg0 - argn`. The return value will *not* affect the context.
// - `@group` Treat `arg0 - argn` as a series of statement arrays that share a
//   context. Each statement will be called in serial and affect the context
//   for the next statement.
//
// Usage:
//
//     var gmap = ['@new google.maps.Map',
//         ['@call document.getElementById', 'gmap'],
//         {
//             center: [ '@new google.maps.LatLng', 0, 0 ],
//             zoom: 2,
//             mapTypeId: [ '@literal google.maps.MapTypeId.ROADMAP' ]
//         }
//     ];
//     wax.Record(gmap);
var wax = wax || {};


// TODO: replace with non-global-modifier
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(fun /*, initialValue */) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var k = 0;
    var accumulator;
    if (arguments.length >= 2) {
      accumulator = arguments[1];
    } else {
      do {
        if (k in t) {
          accumulator = t[k++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++k >= len)
          throw new TypeError();
      }
      while (true);
    }

    while (k < len) {
      if (k in t)
        accumulator = fun.call(undefined, accumulator, t[k], k, t);
      k++;
    }

    return accumulator;
  };
}


wax.Record = function(obj, context) {
    var getFunction = function(head, cur) {
        // TODO: strip out reduce
        var ret = head.split('.').reduce(function(part, segment) {
            return [part[1] || part[0], part[1] ? part[1][segment] : part[0][segment]];
        }, [cur || window, null]);
        if (ret[0] && ret[1]) {
            return ret;
        } else {
            throw head + ' not found.';
        }
    };
    var makeObject = function(fn_name, args) {
        var fn_obj = getFunction(fn_name),
            obj;
        args = args.length ? wax.Record(args) : [];

        // real browsers
        if (Object.create) {
            obj = Object.create(fn_obj[1].prototype);
            fn_obj[1].apply(obj, args);
        // lord have mercy on your soul.
        } else {
            switch (args.length) {
                case 0: obj = new fn_obj[1](); break;
                case 1: obj = new fn_obj[1](args[0]); break;
                case 2: obj = new fn_obj[1](args[0], args[1]); break;
                case 3: obj = new fn_obj[1](args[0], args[1], args[2]); break;
                case 4: obj = new fn_obj[1](args[0], args[1], args[2], args[3]); break;
                case 5: obj = new fn_obj[1](args[0], args[1], args[2], args[3], args[4]); break;
                default: break;
            }
        }
        return obj;
    };
    var runFunction = function(fn_name, args, cur) {
        var fn_obj = getFunction(fn_name, cur);
        var fn_args = args.length ? wax.Record(args) : [];
        // @TODO: This is currently a stopgap measure that calls methods like
        // `foo.bar()` in the context of `foo`. It will probably be necessary
        // in the future to be able to call `foo.bar()` from other contexts.
        if (cur && fn_name.indexOf('.') === -1) {
            return fn_obj[1].apply(cur, fn_args);
        } else {
            return fn_obj[1].apply(fn_obj[0], fn_args);
        }
    };
    var isKeyword = function(string) {
        return wax.util.isString(string) && (wax.util.indexOf([
            '@new',
            '@call',
            '@literal',
            '@chain',
            '@inject',
            '@group'
        ], string.split(' ')[0]) !== -1);
    };
    var altersContext = function(string) {
        return wax.util.isString(string) && (wax.util.indexOf([
            '@new',
            '@call',
            '@chain'
        ], string.split(' ')[0]) !== -1);
    };
    var getStatement = function(obj) {
        if (wax.util.isArray(obj) && obj[0] && isKeyword(obj[0])) {
            return {
                verb: obj[0].split(' ')[0],
                subject: obj[0].split(' ')[1],
                object: obj.slice(1)
            };
        }
        return false;
    };

    var i,
        fn = false,
        ret = null,
        child = null,
        statement = getStatement(obj);
    if (statement) {
        switch (statement.verb) {
        case '@group':
            for (i = 0; i < statement.object.length; i++) {
                ret = wax.Record(statement.object[i], context);
                child = getStatement(statement.object[i]);
                if (child && altersContext(child.verb)) {
                    context = ret;
                }
            }
            return context;
        case '@new':
            return makeObject(statement.subject, statement.object);
        case '@literal':
            fn = getFunction(statement.subject);
            return fn ? fn[1] : null;
        case '@inject':
            return runFunction(statement.subject, statement.object, context);
        case '@chain':
            return runFunction(statement.subject, statement.object, context);
        case '@call':
            return runFunction(statement.subject, statement.object, null);
        }
    } else if (obj !== null && typeof obj === 'object') {
        var keys = wax.util.keys(obj);
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            obj[key] = wax.Record(obj[key], context);
        }
        return obj;
    } else {
        return obj;
    }
};
wax = wax || {};

// Attribution
// -----------
wax.attribution = function() {
    var container,
        a = {};

    a.set = function(content) {
        if (typeof content === 'undefined') return;
        container.innerHTML = content;
        return this;
    };

    a.element = function() {
        return container;
    };

    a.init = function() {
        container = document.createElement('div');
        container.className = 'wax-attribution';
        return this;
    };

    return a.init();
};
wax = wax || {};

// Attribution
// -----------
wax.bwdetect = function(options, callback) {
    var detector = {},
        threshold = options.threshold || 400,
        // test image: 30.29KB
        testImage = 'http://a.tiles.mapbox.com/mapbox/1.0.0/blue-marble-topo-bathy-jul/0/0/0.png?preventcache=' + (+new Date()),
        // High-bandwidth assumed
        // 1: high bandwidth (.png, .jpg)
        // 0: low bandwidth (.png128, .jpg70)
        bw = 1,
        // Alternative versions
        auto = options.auto === undefined ? true : options.auto;

    function bwTest() {
        wax.bw = -1;
        var im = new Image();
        im.src = testImage;
        var first = true;
        var timeout = setTimeout(function() {
            if (first && wax.bw == -1) {
                detector.bw(0);
                first = false;
            }
        }, threshold);
        im.onload = function() {
            if (first && wax.bw == -1) {
                clearTimeout(timeout);
                detector.bw(1);
                first = false;
            }
        };
    }

    detector.bw = function(x) {
        if (!arguments.length) return bw;
        var oldBw = bw;
        if (wax.bwlisteners && wax.bwlisteners.length) (function () {
            listeners = wax.bwlisteners;
            wax.bwlisteners = [];
            for (i = 0; i < listeners; i++) {
                listeners[i](x);
            }
        })();
        wax.bw = x;

        if (bw != (bw = x)) callback(x);
    };

    detector.add = function() {
        if (auto) bwTest();
        return this;
    };

    if (wax.bw == -1) {
      wax.bwlisteners = wax.bwlisteners || [];
      wax.bwlisteners.push(detector.bw);
    } else if (wax.bw !== undefined) {
        detector.bw(wax.bw);
    } else {
        detector.add();
    }
    return detector;
};
// Formatter
// ---------
wax.formatter = function(x) {
    var formatter = {},
        f;

    // Prevent against just any input being used.
    if (x && typeof x === 'string') {
        try {
            // Ugly, dangerous use of eval.
            eval('f = ' + x);
        } catch (e) {
            if (console) console.log(e);
        }
    } else if (x && typeof x === 'function') {
        f = x;
    } else {
        f = function() {};
    }

    // Wrap the given formatter function in order to
    // catch exceptions that it may throw.
    formatter.format = function(options, data) {
        try {
            return f(options, data);
        } catch (e) {
            if (console) console.log(e);
        }
    };

    return formatter;
};
// GridInstance
// ------------
// GridInstances are queryable, fully-formed
// objects for acquiring features from events.
wax.GridInstance = function(grid_tile, formatter, options) {
    options = options || {};
    // resolution is the grid-elements-per-pixel ratio of gridded data.
    // The size of a tile element. For now we expect tiles to be squares.
    var instance = {},
        resolution = options.resolution || 4;
        tileSize = options.tileSize || 256;

    // Resolve the UTF-8 encoding stored in grids to simple
    // number values.
    // See the [utfgrid section of the mbtiles spec](https://github.com/mapbox/mbtiles-spec/blob/master/1.1/utfgrid.md)
    // for details.
    function resolveCode(key) {
        if (key >= 93) key--;
        if (key >= 35) key--;
        key -= 32;
        return key;
    }

    instance.grid_tile = function() {
        return grid_tile;
    };

    instance.getKey = function(x, y) {
        if (!(grid_tile && grid_tile.grid)) return;
        if ((y < 0) || (x < 0)) return;
        if ((Math.floor(y) >= tileSize) ||
            (Math.floor(x) >= tileSize)) return;
        // Find the key in the grid. The above calls should ensure that
        // the grid's array is large enough to make this work.
        return resolveCode(grid_tile.grid[
           Math.floor((y) / resolution)
        ].charCodeAt(
           Math.floor((x) / resolution)
        ));
    };

    // Lower-level than tileFeature - has nothing to do
    // with the DOM. Takes a px offset from 0, 0 of a grid.
    instance.gridFeature = function(x, y) {
        // Find the key in the grid. The above calls should ensure that
        // the grid's array is large enough to make this work.
        var key = this.getKey(x, y);

        if (grid_tile.keys[key] && grid_tile.data[grid_tile.keys[key]]) {
            return grid_tile.data[grid_tile.keys[key]];
        }
    };

    // Get a feature:
    //
    // * `x` and `y`: the screen coordinates of an event
    // * `tile_element`: a DOM element of a tile, from which we can get an offset.
    // * `options` options to give to the formatter: minimally having a `format`
    //   member, being `full`, `teaser`, or something else.
    instance.tileFeature = function(x, y, tile_element, options) {
        // IE problem here - though recoverable, for whatever reason
        var offset = wax.util.offset(tile_element);
            feature = this.gridFeature(x - offset.left, y - offset.top);

        if (feature) return formatter.format(options, feature);
    };

    return instance;
};
// GridManager
// -----------
// Generally one GridManager will be used per map.
//
// It takes one options object, which current accepts a single option:
// `resolution` determines the number of pixels per grid element in the grid.
// The default is 4.
wax.GridManager = function(options) {
    options = options || {};

    var resolution = options.resolution || 4,
        grid_tiles = {},
        manager = {},
        formatter;

    var formatterUrl = function(url) {
        return url.replace(/\d+\/\d+\/\d+\.\w+/, 'layer.json');
    };

    var gridUrl = function(url) {
        return url.replace(/(\.png|\.jpg|\.jpeg)(\d*)/, '.grid.json');
    };

    function getFormatter(url, callback) {
        if (typeof formatter !== 'undefined') {
            return callback(null, formatter);
        } else {
            wax.request.get(formatterUrl(url), function(err, data) {
                if (data && data.formatter) {
                    formatter = wax.formatter(data.formatter);
                } else {
                    formatter = false;
                }
                return callback(err, formatter);
            });
        }
    }

    function templatedGridUrl(template) {
        if (typeof template === 'string') template = [template];
        return function templatedGridFinder(url) {
            if (!url) return;
            var xyz = /(\d+)\/(\d+)\/(\d+)\.[\w\._]+/g.exec(url);
            if (!xyz) return;
            return template[parseInt(xyz[2], 10) % template.length]
                .replace('{z}', xyz[1])
                .replace('{x}', xyz[2])
                .replace('{y}', xyz[3]);
        };
    }

    manager.formatter = function(x) {
        if (!arguments.length) return formatter;
        formatter =  wax.formatter(x);
        return manager;
    };

    manager.formatterUrl = function(x) {
        if (!arguments.length) return formatterUrl;
        formatterUrl = typeof x === 'string' ?
            function() { return x; } : x;
        return manager;
    };

    manager.gridUrl = function(x) {
        if (!arguments.length) return gridUrl;
        gridUrl = typeof x === 'function' ?
            x : templatedGridUrl(x);
        return manager;
    };

     manager.getGrid = function(url, callback) {
        getFormatter(url, function(err, f) {
            var gurl = gridUrl(url);
            if (err || !f || !gurl) return callback(err, null);

            wax.request.get(gurl, function(err, t) {
                if (err) return callback(err, null);
                callback(null, wax.GridInstance(t, f, {
                    resolution: resolution || 4
                }));
            });
        });
        return manager;
    };

    if (options.formatter) manager.formatter(options.formatter);
    if (options.grids) manager.gridUrl(options.grids);

    return manager;
};
// Wax Legend
// ----------

// Wax header
var wax = wax || {};

wax.legend = function() {
    var element,
        legend = {},
        container;

    legend.element = function() {
        return container;
    };

    legend.content = function(content) {
        if (!arguments.length) return element.innerHTML;
        if (content) {
            element.innerHTML = content;
            element.style.display = 'block';
        } else {
            element.innerHTML = '';
            element.style.display = 'none';
        }
        return this;
    };

    legend.add = function() {
        container = document.createElement('div');
        container.className = 'wax-legends';

        element = document.createElement('div');
        element.className = 'wax-legend';
        element.style.display = 'none';

        container.appendChild(element);
        return this;
    };

    return legend.add();
};
// Like underscore's bind, except it runs a function
// with no arguments off of an object.
//
//     var map = ...;
//     w(map).melt(myFunction);
//
// is equivalent to
//
//     var map = ...;
//     myFunction(map);
//
var w = function(self) {
    self.melt = function(func, obj) {
        return func.apply(obj, [self, obj]);
    };
    return self;
};
// Wax GridUtil
// ------------

// Wax header
var wax = wax || {};

// Request
// -------
// Request data cache. `callback(data)` where `data` is the response data.
wax.request = {
    cache: {},
    locks: {},
    promises: {},
    get: function(url, callback) {
        // Cache hit.
        if (this.cache[url]) {
            return callback(this.cache[url][0], this.cache[url][1]);
        // Cache miss.
        } else {
            this.promises[url] = this.promises[url] || [];
            this.promises[url].push(callback);
            // Lock hit.
            if (this.locks[url]) return;
            // Request.
            var that = this;
            this.locks[url] = true;
            reqwest({
                url: wax.util.addUrlData(url, 'callback=grid'),
                type: 'jsonp',
                jsonpCallback: 'callback',
                success: function(data) {
                    that.locks[url] = false;
                    that.cache[url] = [null, data];
                    for (var i = 0; i < that.promises[url].length; i++) {
                        that.promises[url][i](that.cache[url][0], that.cache[url][1]);
                    }
                },
                error: function(err) {
                    that.locks[url] = false;
                    that.cache[url] = [err, null];
                    for (var i = 0; i < that.promises[url].length; i++) {
                        that.promises[url][i](that.cache[url][0], that.cache[url][1]);
                    }
                }
            });
        }
    }
};
if (!wax) var wax = {};

// A wrapper for reqwest jsonp to easily load TileJSON from a URL.
wax.tilejson = function(url, callback) {
    reqwest({
        url: wax.util.addUrlData(url, 'callback=grid'),
        type: 'jsonp',
        jsonpCallback: 'callback',
        success: callback,
        error: callback
    });
};
var wax = wax || {};
wax.tooltip = {};

wax.tooltip = function(options) {
    this._currentTooltip = undefined;
    options = options || {};
    if (options.animationOut) this.animationOut = options.animationOut;
    if (options.animationIn) this.animationIn = options.animationIn;
};

// Helper function to determine whether a given element is a wax popup.
wax.tooltip.prototype.isPopup = function(el) {
    return el && el.className.indexOf('wax-popup') !== -1;
};

// Get the active tooltip for a layer or create a new one if no tooltip exists.
// Hide any tooltips on layers underneath this one.
wax.tooltip.prototype.getTooltip = function(feature, context) {
    var tooltip = document.createElement('div');
    tooltip.className = 'wax-tooltip wax-tooltip-0';
    tooltip.innerHTML = feature;
    context.appendChild(tooltip);
    return tooltip;
};

// Hide a given tooltip.
wax.tooltip.prototype.hideTooltip = function(el) {
    if (!el) return;
    var event,
        remove = function() {
        if (this.parentNode) this.parentNode.removeChild(this);
    };

    if (el.style['-webkit-transition'] !== undefined && this.animationOut) {
        event = 'webkitTransitionEnd';
    } else if (el.style.MozTransition !== undefined && this.animationOut) {
        event = 'transitionend';
    }

    if (event) {
        // This code assumes that transform-supporting browsers
        // also support proper events. IE9 does both.
        el.addEventListener(event, remove, false);
        el.addEventListener('transitionend', remove, false);
        el.className += ' ' + this.animationOut;
    } else {
        if (el.parentNode) el.parentNode.removeChild(el);
    }
};

// Expand a tooltip to be a "popup". Suspends all other tooltips from being
// shown until this popup is closed or another popup is opened.
wax.tooltip.prototype.click = function(feature, context) {
    // Hide any current tooltips.
    if (this._currentTooltip) {
        this.hideTooltip(this._currentTooltip);
        this._currentTooltip = undefined;
    }

    var tooltip = this.getTooltip(feature, context);
    tooltip.className += ' wax-popup';
    tooltip.innerHTML = feature;

    var close = document.createElement('a');
    close.href = '#close';
    close.className = 'close';
    close.innerHTML = 'Close';
    tooltip.appendChild(close);

    var closeClick = wax.util.bind(function(ev) {
        this.hideTooltip(tooltip);
        this._currentTooltip = undefined;
        ev.returnValue = false; // Prevents hash change.
        if (ev.stopPropagation) ev.stopPropagation();
        if (ev.preventDefault) ev.preventDefault();
        return false;
    }, this);

    // IE compatibility.
    if (close.addEventListener) {
        close.addEventListener('click', closeClick, false);
    } else if (close.attachEvent) {
        close.attachEvent('onclick', closeClick);
    }

    this._currentTooltip = tooltip;
};

// Show a tooltip.
wax.tooltip.prototype.over = function(feature, context) {
    if (!feature) return;
    context.style.cursor = 'pointer';

    if (this.isPopup(this._currentTooltip)) {
        return;
    } else {
        this._currentTooltip = this.getTooltip(feature, context);
    }
};


// Hide all tooltips on this layer and show the first hidden tooltip on the
// highest layer underneath if found.
wax.tooltip.prototype.out = function(context) {
    context.style.cursor = 'default';

    if (this.isPopup(this._currentTooltip)) {
        return;
    } else if (this._currentTooltip) {
        this.hideTooltip(this._currentTooltip);
        this._currentTooltip = undefined;
    }
};
var wax = wax || {};
wax.util = wax.util || {};

// Utils are extracted from other libraries or
// written from scratch to plug holes in browser compatibility.
wax.util = {
    // From Bonzo
    offset: function(el) {
        // TODO: window margins
        //
        // Okay, so fall back to styles if offsetWidth and height are botched
        // by Firefox.
        var width = el.offsetWidth || parseInt(el.style.width, 10),
            height = el.offsetHeight || parseInt(el.style.height, 10),
            top = 0,
            left = 0;

        var calculateOffset = function(el) {
            if (el === document.body || el === document.documentElement) return;
            top += el.offsetTop;
            left += el.offsetLeft;

            var style = el.style.transform ||
                el.style.WebkitTransform ||
                el.style.OTransform ||
                el.style.MozTransform ||
                el.style.msTransform;

            if (style) {
                if (match = style.match(/translate\((.+)px, (.+)px\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                } else if (match = style.match(/translate3d\((.+)px, (.+)px, (.+)px\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                } else if (match = style.match(/matrix3d\(([\-\d,\s]+)\)/)) {
                    var pts = match[1].split(',');
                    top += parseInt(pts[13], 10);
                    left += parseInt(pts[12], 10);
                } else if (match = style.match(/matrix\(.+, .+, .+, .+, (.+), (.+)\)/)) {
                    top += parseInt(match[2], 10);
                    left += parseInt(match[1], 10);
                }
            }
        };

        calculateOffset(el);

        try {
            while (el = el.offsetParent) calculateOffset(el);
        } catch(e) {
            // Hello, internet explorer.
        }

        // Offsets from the body
        top += document.body.offsetTop;
        left += document.body.offsetLeft;
        // Offsets from the HTML element
        top += document.body.parentNode.offsetTop;
        left += document.body.parentNode.offsetLeft;

        // Firefox and other weirdos. Similar technique to jQuery's
        // `doesNotIncludeMarginInBodyOffset`.
        var htmlComputed = document.defaultView ?
            window.getComputedStyle(document.body.parentNode, null) :
            document.body.parentNode.currentStyle;
        if (document.body.parentNode.offsetTop !==
            parseInt(htmlComputed.marginTop, 10) &&
            !isNaN(parseInt(htmlComputed.marginTop, 10))) {
            top += parseInt(htmlComputed.marginTop, 10);
            left += parseInt(htmlComputed.marginLeft, 10);
        }

        return {
            top: top,
            left: left,
            height: height,
            width: width
        };
    },

    '$': function(x) {
        return (typeof x === 'string') ?
            document.getElementById(x) :
            x;
    },

    // From underscore, minus funcbind for now.
    // Returns a version of a function that always has the second parameter,
    // `obj`, as `this`.
    bind: function(func, obj) {
        var args = Array.prototype.slice.call(arguments, 2);
        return function() {
            return func.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
        };
    },
    // From underscore
    isString: function(obj) {
        return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    },
    // IE doesn't have indexOf
    indexOf: function(array, item) {
        var nativeIndexOf = Array.prototype.indexOf;
        if (array === null) return -1;
        var i, l;
        if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
        for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
        return -1;
    },
    // is this object an array?
    isArray: Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    // From underscore: reimplement the ECMA5 `Object.keys()` method
    keys: Object.keys || function(obj) {
        var ho = Object.prototype.hasOwnProperty;
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) if (ho.call(obj, key)) keys[keys.length] = key;
        return keys;
    },
    // From quirksmode: normalize the offset of an event from the top-left
    // of the page.
    eventoffset: function(e) {
        var posx = 0;
        var posy = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
            // Good browsers
            return {
                x: e.pageX,
                y: e.pageY
            };
        } else if (e.clientX || e.clientY) {
            // Internet Explorer
            var doc = document.documentElement, body = document.body;
            var htmlComputed = document.body.parentNode.currentStyle;
            var topMargin = parseInt(htmlComputed.marginTop, 10) || 0;
            var leftMargin = parseInt(htmlComputed.marginLeft, 10) || 0;
            return {
                x: e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0) + leftMargin,
                y: e.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                    (doc && doc.clientTop  || body && body.clientTop  || 0) + topMargin
            };
        } else if (e.touches && e.touches.length === 1) {
            // Touch browsers
            return {
                x: e.touches[0].pageX,
                y: e.touches[0].pageY
            };
        }
    },
    // parseUri 1.2.2
    // Steven Levithan <stevenlevithan.com>
    parseUri: function(str) {
        var o = {
            strictMode: false,
            key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
            q:   {
                name:   "queryKey",
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        },
            m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });
        return uri;
    },
    // appends callback onto urls regardless of existing query params
    addUrlData: function(url, data) {
        url += (this.parseUri(url).query) ? '&' : '?';
        return url += data;
    }
};
wax = wax || {};
wax.g = wax.g || {};

// Attribution
// -----------
// Attribution wrapper for Google Maps.
wax.g.attribution = function(map, tilejson) {
    tilejson = tilejson || {};
    var a, // internal attribution control
        attribution = {};

    attribution.element = function() {
        return a.element();
    };

    attribution.appendTo = function(elem) {
        wax.util.$(elem).appendChild(a.element());
        return this;
    };

    attribution.init = function() {
        a = wax.attribution();
        a.set(tilejson.attribution);
        a.element().className = 'wax-attribution wax-g';
        return this;
    };

    return attribution.init();
};
wax = wax || {};
wax.g = wax.g || {};

// Bandwidth Detection
// ------------------
wax.g.bwdetect = function(map, options) {
    options = options || {};
    var lowpng = options.png || '.png128',
        lowjpg = options.jpg || '.jpg70';

    // Create a low-bandwidth map type.
    if (!map.mapTypes['mb-low']) {
        var mb = map.mapTypes.mb;
        var tilejson = {
            tiles: [],
            scheme: mb.options.scheme,
            blankImage: mb.options.blankImage,
            minzoom: mb.minZoom,
            maxzoom: mb.maxZoom,
            name: mb.name,
            description: mb.description
        };
        for (var i = 0; i < mb.options.tiles.length; i++) {
            tilejson.tiles.push(mb.options.tiles[i]
                .replace('.png', lowpng)
                .replace('.jpg', lowjpg));
        }
        m.mapTypes.set('mb-low', new wax.g.connector(tilejson));
    }

    return wax.bwdetect(options, function(bw) {
      map.setMapTypeId(bw ? 'mb' : 'mb-low');
    });
};
wax = wax || {};
wax.g = wax.g || {};

// A control that adds interaction to a google Map object.
//
// Takes an options object with the following keys:
//
// * `callbacks` (optional): an `out`, `over`, and `click` callback.
//   If not given, the `wax.tooltip` library will be expected.
// * `clickAction` (optional): **full** or **location**: default is
//   **full**.
wax.g.interaction = function(map, tilejson, options) {
    tilejson = tilejson || {};
    options = options || {};
    // Our GridManager (from `gridutil.js`). This will keep the
    // cache of grid information and provide friendly utility methods
    // that return `GridTile` objects instead of raw data.
    var interaction = {
        waxGM: new wax.GridManager(tilejson),

        // This requires wax.Tooltip or similar
        callbacks: options.callbacks || new wax.tooltip(),
        clickAction: options.clickAction || 'full',
        eventHandlers:{},

        // Attach listeners to the map
        add: function() {
            this.eventHandlers.tileloaded = google.maps.event.addListener(map, 'tileloaded',
                wax.util.bind(this.clearTileGrid, this));

            this.eventHandlers.idle = google.maps.event.addListener(map, 'idle',
                wax.util.bind(this.clearTileGrid, this));

            this.eventHandlers.mousemove = google.maps.event.addListener(map, 'mousemove',
                this.onMove());

            this.eventHandlers.click = google.maps.event.addListener(map, 'click',
                this.click());

            return this;
        },

        // Remove interaction events from the map.
        remove: function() {
            google.maps.event.removeListener(this.eventHandlers.tileloaded);
            google.maps.event.removeListener(this.eventHandlers.idle);
            google.maps.event.removeListener(this.eventHandlers.mousemove);
            google.maps.event.removeListener(this.eventHandlers.click);
            return this;
        },

        // Search through `.tiles` and determine the position,
        // from the top-left of the **document**, and cache that data
        // so that `mousemove` events don't always recalculate.
        getTileGrid: function() {
            // Get all 'marked' tiles, added by the `wax.g.MapType` layer.
            // Return an array of objects which have the **relative** offset of
            // each tile, with a reference to the tile object in `tile`, since the API
            // returns evt coordinates as relative to the map object.
            if (!this._getTileGrid) {
                this._getTileGrid = [];
                var zoom = map.getZoom();
                var mapOffset = wax.util.offset(map.getDiv());
                var get = wax.util.bind(function(mapType) {
                    if (!mapType.interactive) return;
                    for (var key in mapType.cache) {
                        if (key.split('/')[0] != zoom) continue;
                        var tileOffset = wax.util.offset(mapType.cache[key]);
                        this._getTileGrid.push([
                            tileOffset.top - mapOffset.top,
                            tileOffset.left - mapOffset.left,
                            mapType.cache[key]
                        ]);
                    }
                }, this);
                // Iterate over base mapTypes and overlayMapTypes.
                for (var i in map.mapTypes) get(map.mapTypes[i]);
                map.overlayMapTypes.forEach(get);
            }
            return this._getTileGrid;
        },

        clearTileGrid: function(map, e) {
            this._getTileGrid = null;
        },

        getTile: function(evt) {
            var tile;
            var grid = this.getTileGrid();
            for (var i = 0; i < grid.length; i++) {
                if ((grid[i][0] < evt.pixel.y) &&
                    ((grid[i][0] + 256) > evt.pixel.y) &&
                    (grid[i][1] < evt.pixel.x) &&
                    ((grid[i][1] + 256) > evt.pixel.x)) {
                    tile = grid[i][2];
                    break;
                }
            }
            return tile || false;
        },

        onMove: function(evt) {
            if (!this._onMove) this._onMove = wax.util.bind(function(evt) {
                var tile = this.getTile(evt);
                if (tile) {
                    this.waxGM.getGrid(tile.src, wax.util.bind(function(err, g) {
                        if (err || !g) return;
                        var feature = g.tileFeature(
                            evt.pixel.x + wax.util.offset(map.getDiv()).left,
                            evt.pixel.y + wax.util.offset(map.getDiv()).top,
                            tile,
                            { format: 'teaser' }
                        );
                        // Support only a single layer.
                        // Thus a layer index of **0** is given to the tooltip library
                        if (feature && this.feature !== feature) {
                            this.feature = feature;
                            this.callbacks.out(map.getDiv());
                            this.callbacks.over(feature, map.getDiv(), 0, evt);
                        } else if (!feature) {
                            this.feature = null;
                            this.callbacks.out(map.getDiv());
                        }
                    }, this));
                }
            }, this);
            return this._onMove;
        },

        click: function(evt) {
            if (!this._onClick) this._onClick = wax.util.bind(function(evt) {
                var tile = this.getTile(evt);
                if (tile) {
                    this.waxGM.getGrid(tile.src, wax.util.bind(function(err, g) {
                        if (err || !g) return;
                        var feature = g.tileFeature(
                            evt.pixel.x + wax.util.offset(map.getDiv()).left,
                            evt.pixel.y + wax.util.offset(map.getDiv()).top,
                            tile,
                            { format: this.clickAction }
                        );
                        if (feature) {
                            switch (this.clickAction) {
                                case 'full':
                                    this.callbacks.click(feature, map.getDiv(), 0, evt);
                                    break;
                                case 'location':
                                    window.location = feature;
                                    break;
                            }
                        }
                    }, this));
                }
            }, this);
            return this._onClick;
        }
    };

    // Return the interaction control such that the caller may manipulate it
    // e.g. remove it.
    return interaction.add(map);
};

wax = wax || {};
wax.g = wax.g || {};

// Legend Control
// --------------
// Adds legends to a google Map object.
wax.g.legend = function(map, tilejson) {
    tilejson = tilejson || {};
    var l, // parent legend
        legend = {};

    legend.add = function() {
        l = wax.legend()
            .content(tilejson.legend || '');
        return this;
    };

    legend.element = function() {
        return l.element();
    };

    legend.appendTo = function(elem) {
        wax.util.$(elem).appendChild(l.element());
        return this;
    };

    return legend.add();
};
// Wax for Google Maps API v3
// --------------------------

// Wax header
var wax = wax || {};
wax.g = wax.g || {};

// Wax Google Maps MapType: takes an object of options in the form
//
//     {
//       name: '',
//       filetype: '.png',
//       layerName: 'world-light',
//       alt: '',
//       zoomRange: [0, 18],
//       baseUrl: 'a url',
//     }
wax.g.connector = function(options) {
    options = options || {};

    this.options = {
        tiles: options.tiles,
        scheme: options.scheme || 'xyz',
        cache_buster: options.cache_buster || function(){},
        blankImage: options.blankImage
    };

    this.minZoom = options.minzoom || 0;
    this.maxZoom = options.maxzoom || 22;

    this.name = options.name || '';
    this.description = options.description || '';

    // non-configurable options
    this.interactive = true;
    this.tileSize = new google.maps.Size(256, 256);

    // DOM element cache
    this.cache = {};
};

// Get a tile element from a coordinate, zoom level, and an ownerDocument.
wax.g.connector.prototype.getTile = function(coord, zoom, ownerDocument) {
    var key = zoom + '/' + coord.x + '/' + coord.y;
    if (!this.cache[key]) {
        var img = this.cache[key] = new Image(256, 256);
        this.cache[key].src = this.getTileUrl(coord, zoom);
        this.cache[key].setAttribute('gTileKey', key);
        this.cache[key].onerror = function() { img.style.display = 'none'; };
    }
    return this.cache[key];
};

// Remove a tile that has fallen out of the map's viewport.
//
// TODO: expire cache data in the gridmanager.
wax.g.connector.prototype.releaseTile = function(tile) {
    var key = tile.getAttribute('gTileKey');
    this.cache[key] && delete this.cache[key];
    tile.parentNode && tile.parentNode.removeChild(tile);
};

// Get a tile url, based on x, y coordinates and a z value.
wax.g.connector.prototype.getTileUrl = function(coord, z) {
    // Y coordinate is flipped in Mapbox, compared to Google
    var mod = Math.pow(2, z),
        y = (this.options.scheme === 'tms') ?
            (mod - 1) - coord.y :
            coord.y,
        x = (coord.x % mod);

    x = (x < 0) ? (coord.x % mod) + mod : x;

    if (y < 0) return this.options.blankImage;

    return this.options.tiles
        [parseInt(x + y, 10) %
            this.options.tiles.length]
                .replace('{z}', z)
                .replace('{x}', x)
                .replace('{y}', y)
                .replace('{cache}', this.options.cache_buster());
};
