var TilesLoader = require('../../geo/ui/tiles-loader');

var LoaderOverlay = function (data) {
  var overlay = new TilesLoader();

  return overlay.render();
};

module.exports = LoaderOverlay;
