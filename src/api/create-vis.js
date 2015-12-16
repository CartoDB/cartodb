var _ = require('underscore');
var Vis = require('../vis/vis');

var createVis = function(el, vizjson, options, callback) {
  if (!el) {
    throw new TypeError("a DOM element should be provided");
  }

  var
  args = arguments,
  fn   = args[args.length -1];

  if (_.isFunction(fn)) {
    callback = fn;
  }

  el = (typeof el === 'string' ? document.getElementById(el) : el);

  var vis = new Vis({
    el: el
  });

  if (vizjson) {
    vis.load(vizjson, options);

    if (callback) {
      vis.done(callback);
    }
  }

  return vis;
};

module.exports = createVis;
