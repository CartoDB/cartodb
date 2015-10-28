var $ = require('jquery');
require('jquery-proxy').set($);
require('ajax-proxy').set($.ajax);

require('backbone-proxy').set(require('backbone'));

var isLeafletAlreadyLoaded = !!window.L;
var L = require('leaflet');
if (isLeafletAlreadyLoaded) L.noConflict();
require('leaflet-proxy').set(L);

module.exports = require('./cdb-non-core');
