var $ = require('jquery');

var TABLET_WIDTH = 760;
var MOBILE_WIDTH = 480;

var utils = {};

utils._isViewport = function (vp) {
  return $(window).width() < vp;
};

utils.isMobileViewport = function () {
  return this._isViewport(MOBILE_WIDTH);
};

utils.isTabletViewport = function () {
  return this._isViewport(TABLET_WIDTH);
};

module.exports = utils;
