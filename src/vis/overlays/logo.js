var LogoView = require('../../geo/ui/logo-view');

var LogoOverlay = function (data, opts) {
  var overlay = new LogoView();

  return overlay.render();
};

module.exports = LogoOverlay;
