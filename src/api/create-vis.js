var _ = require('underscore');
var Vis = require('../vis/vis');
var Loader = require('../core/loader');
var Promise = require('./promise');

var createVis = function (el, vizjson, options, callback) {
  if (!el) {
    throw new TypeError('a DOM element must be provided');
  }
  if (!vizjson) {
    throw new TypeError('a vizjson URL or object must be provided');
  }

  var promise = new Promise();

  if (typeof vizjson === 'string') {
    var url = vizjson;
    Loader.get(url, function (vizjson) {
      if (vizjson) {
        var promise2 = createVis(el, vizjson, options);

        promise2.done(function () {
          promise.trigger('done', arguments[0], arguments[1]);
          if (callback) {
            callback();
          }
        });

        promise2.error(function () {
          promise.trigger('error', arguments[0]);
        });
      } else {
        throw new Error('error fetching viz.json file');
      }
    });

    return promise;
  }

  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }

  var vis = new Vis({
    el: el
  });

  vis.bind('done', function () {
    promise.trigger('done', arguments[0], arguments[1]);
    if (callback) {
      callback();
    }
  });

  vis.bind('error', function () {
    promise.trigger('error', arguments[0]);
  });

  vis.load(vizjson, options);

  return promise;
};

module.exports = createVis;
