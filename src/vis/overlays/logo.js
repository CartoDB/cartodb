var LogoView = require('../../geo/ui/logo-view');

var LogoOverlay = function (data, opts) {
  var view = new LogoView();

  return view.render();
};

module.exports = LogoOverlay;
