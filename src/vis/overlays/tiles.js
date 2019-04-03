var TilesView = require('../../geo/ui/tiles/tiles-view');

var TilesOverlay = function (data, opts) {
  if (!opts.mapModel) throw new Error('mapModel is required');

  var view = new TilesView({
    map: opts.mapModel
  });

  return view.render();
};

module.exports = TilesOverlay;
