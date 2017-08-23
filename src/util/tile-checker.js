var $ = require('jquery');
var getValue = require('./get-object-value');
var limitsSVG = require('../../themes/img/timeout.svg');

var buildErrorTile = function (svg) {
  return 'data:image/svg+xml;base64,' + window.btoa(svg);
};

var TILE_ERRORS = {
  limit: buildErrorTile(limitsSVG),
  default: buildErrorTile(limitsSVG)
};

module.exports = {
  check: function (url, callback) {
    $.ajax({
      url: url,
      complete: function (jqXHR) {
        var errors = getValue(jqXHR, 'responseJSON.errors_with_context', []);
        var error = errors[0] || {};
        var errorType = error.type || 'default';
        var errorTile = TILE_ERRORS[errorType] || TILE_ERRORS['default'];

        return callback(errorType, errorTile, error.message);
      }
    });
  }
};
