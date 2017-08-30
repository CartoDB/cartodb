var AttributionView = require('../../geo/ui/attribution/attribution-view');

var AttributionOverlay = function (_data, opts) {
  if (!opts.mapModel) throw new Error('mapModel is required');

  var overlay = new AttributionView({
    map: opts.mapModel
  });

  return overlay.render();
};

module.exports = AttributionOverlay;
