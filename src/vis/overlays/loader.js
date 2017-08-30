var TilesLoader = require('../../geo/ui/tiles-loader');

var LoaderOverlay = function (data) {
  var view = new TilesLoader();

  return view.render();
};

module.exports = LoaderOverlay;
