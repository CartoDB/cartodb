var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'diDashboardHelpers'
];

module.exports = {
  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._visMap = this._diDashboardHelpers.visMap();
    this._map = this._diDashboardHelpers.getMap();
    this._infowindowModel = this._diDashboardHelpers.getInfowindowModel();

    this._visMap.on('featureClick', this._onUpdatePosition, this);
    this._visMap.on('change', this._onUpdatePosition, this);
  },

  untrack: function () {
    var visMap = this._diDashboardHelpers.visMap();
    visMap.off('featureClick', this._onFeatureClicked, this);
  },

  _onUpdatePosition: function (event) {
    this._infowindowModel.set({
      visibility: true,
      latlng: event.latlng,
      pos: event.position,
      size: this._visMap._mapViewSize
    });
  }
};
