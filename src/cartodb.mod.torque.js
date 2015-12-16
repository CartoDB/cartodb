/* global google */
var cdb = require('cdb');
var moduleLoad = require('./api/module-load');
var torque = window.torque = require('torque.js'); // standalone torque lib, required for gmaps/leaflet layer view

if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
  cdb.geo.GMapsTorqueLayerView = require('./geo/gmaps/gmaps-torque-layer-view');
}

cdb.geo.LeafletTorqueLayer = require('./geo/leaflet/leaflet-torque-layer');

moduleLoad('torque', torque);
module.exports = torque;
