var TilesLoader = require('../../geo/ui/tiles-loader');

var LoaderOverlay = function (data) {
  var tilesLoader = new TilesLoader();
  return tilesLoader.render();
};

module.exports = LoaderOverlay;
