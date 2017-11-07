var _ = require('underscore-cdb-v3');
var UrlHelper = require('./url');
var MOBILE_DEVICES_REGEX = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

var mapOptionsFromUrlParams = {
  search: _isEqualToTrue,
  title: _isEqualToTrue,
  description: _isEqualToTrue,
  shareable: _isEqualToTrue,
  fullscreen: _isEqualToTrue,
  cartodb_logo: _isEqualToTrue,
  scrollwheel: _isEqualToTrue,
  sublayer_options: _layerVisibility,
  layer_selector: _isEqualToTrue,
  legends: _isEqualToTrue
};

module.exports = {
  getMapOptions: function () {
    return UrlHelper.getUrlParams(mapOptionsFromUrlParams);
  },

  isMobileDevice: function () {
    return MOBILE_DEVICES_REGEX.test(navigator.userAgent);
  }
};

function _isEqualToTrue (value) {
  return value === 'true';
}

function _layerVisibility (value) {
  var BASE = 10;

  if (!value || !value.length) {
    return null;
  }

  return _.map(value.split('|'), function (value) {
    return {
      visible: !!parseInt(value, BASE)
    };
  });
}
