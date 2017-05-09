var isLeafletAlreadyLoaded = !!window.L;

var L = require('leaflet');
require('mousewheel'); // registers itself to $.event; TODO what's this required for? still relevant for supported browsers?
require('mwheelIntent'); // registers itself to $.event; TODO what's this required for? still relevant for supported browsers?

var cdb = require('cdb');
if (window) {
  window.cartodb = window.cdb = cdb;
}

if (isLeafletAlreadyLoaded) L.noConflict();

cdb.createVis = require('./api/create-vis');

module.exports = cdb;
