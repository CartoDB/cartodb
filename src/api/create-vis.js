var _ = require('underscore');
var Vis = require('../vis/vis');
var Loader = require('../core/loader');

var DEFAULT_OPTIONS = {
  tiles_loader: true,
  loaderControl: true,
  infowindow: true,
  tooltip: true,
  time_slider: true
};

var createVis = function (el, vizjson, options, callback) {
  if (!el) {
    throw new TypeError('a DOM element must be provided');
  }
  if (!vizjson) {
    throw new TypeError('a vizjson URL or object must be provided');
  }

  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }

  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var vis = new Vis({
    el: el
  });

  if (callback) {
    vis.done(callback);
  }

  if (typeof vizjson === 'string') {
    var url = vizjson;
    Loader.get(url, function (vizjson) {
      if (vizjson) {
        vis.load(vizjson, options);
      } else {
        throw new Error('error fetching viz.json file');
      }
    });
  } else {
    vis.load(vizjson, options);
  }

  return vis;
};

module.exports = createVis;
