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

  if (typeof vizjson === 'string') {
    return loadVizJSONAndCreateVis(el, vizjson, options, callback);
  }

  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }

  var DEFAULT_OPTIONS = {
    tiles_loader: true,
    loaderControl: true,
    infowindow: true,
    tooltip: true,
    time_slider: true
  };

  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var vis = new Vis({
    el: el
  });

  var promise = new Promise();
  if (callback) {
    promise.done(callback);
  }

  bindObjectEventsToPromise(vis, promise, callback);

  vis.load(vizjson, options);

  return promise;
};

var loadVizJSONAndCreateVis = function (el, vizjson, options) {
  var promise = new Promise();
  var url = vizjson;
  Loader.get(url, function (vizjson) {
    if (vizjson) {
      var createVisPromise = createVis(el, vizjson, options);
      bindObjectEventsToPromise(createVisPromise, promise);
    } else {
      throw new Error('error fetching viz.json file');
    }
  });

  return promise;
};

var bindObjectEventsToPromise = function (object, promise) {
  object.bind('done', function () {
    promise.trigger('done', arguments[0], arguments[1]);
  });

  object.bind('error', function () {
    promise.trigger('error', arguments[0]);
  });
};

module.exports = createVis;
