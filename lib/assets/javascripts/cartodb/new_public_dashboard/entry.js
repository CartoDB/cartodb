var $ = require('jquery');
var cdb = require('cartodb.js');
var FavMapView = require('./fav_map_view');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    var favMapView = new FavMapView(window.favMapViewAttrs);
    favMapView.render();
  });
});
