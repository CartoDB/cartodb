require('jquery.ui.core'); // registers itself to $
require('jquery.ui.widget'); // registers itself to $
require('jquery.ui.mouse'); // registers itself to $
require('jquery.ui.slider'); // registers itself to $
var torque = window.torque = require('torque.js'); // standalone torque lib, required for gmaps/leaflet layer view

// Get and mutate the global cdb object, add expected objects for gmaps/leaflet if present:
var cdb = window.cdb;
if (!cdb) {
  throw new Error('cartodb.js is required for this lib to work, load it before this one');
}

if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
  cdb.geo.GMapsTorqueLayerView = require('./geo/gmaps/gmaps-torque-layer-view');
}

cdb.geo.LeafletTorqueLayer = require('./geo/leaflet/leaflet-torque-layer');

cdb.geo.ui.TimeSlider = require('./geo/ui/time-slider');

cdb.moduleLoad('torque', torque);

module.exports = torque;
