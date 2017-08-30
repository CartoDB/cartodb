var LimitsView = require('../../geo/ui/limits/limits-view');

var LimitsOverlay = function (data, opts) {
  if (!opts.mapModel) throw new Error('mapModel is required');

  var overlay = new LimitsView({
    map: opts.mapModel
  });

  return overlay.render();
};

module.exports = LimitsOverlay;
