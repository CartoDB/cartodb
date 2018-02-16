var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'overlayDefinitionsCollection'
];

/**
 *  Only manage **OVERLAYS** actions between Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._overlayDefinitionsCollection.on('add', this._onOverlayDefinitionAdded, this);
    this._overlayDefinitionsCollection.on('remove', this._onOverlayDefinitionRemoved, this);
    return this;
  },

  _onOverlayDefinitionAdded: function (mdl) {
    this._diDashboardHelpers.getOverlays().add(mdl.toJSON());
  },

  _onOverlayDefinitionRemoved: function (mdl) {
    var collection = this._diDashboardHelpers.getOverlays();
    var overlay = collection.findWhere({ type: mdl.get('type') });
    overlay && collection.remove(overlay);
  }
};
