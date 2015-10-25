var $ = require('jquery');
require('jquery-proxy').set($);
require('ajax-proxy').set($.ajax);
var L = require('leaflet');
L.noConflict(); // to remove window.L (and restore prev object if any)
require('leaflet-proxy').set(L);

module.exports = require('./cdb');
