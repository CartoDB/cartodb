var AttributionView = require('../../geo/ui/attribution/attribution-view');

var AttributionOverlay = function (_data, opts) {
  if (!opts.mapModel) throw new Error('mapModel is required');

  var view = new AttributionView({
    map: opts.mapModel
  });

  return view.render();
};

module.exports = AttributionOverlay;
