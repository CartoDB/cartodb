var $ = require('jquery');
var cdb = require('cartodb.js');
var createFavMapVis = require('./create_fav_map_vis');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    createFavMapVis(cdb, window.favMapCreateVis);
  });
});
