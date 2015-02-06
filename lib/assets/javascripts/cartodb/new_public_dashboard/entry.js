var $ = require('jquery');
var cdb = require('cartodb.js');
var FavMapView = require('./fav_map_view');
var UserInfoView = require('./user_info_view');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    $(document.body).bind(function () {
      cdb.god.trigger('closeDialogs');
    });

    var favMapView = new FavMapView(window.favMapViewAttrs);
    favMapView.render();

    var userInfoView = new UserInfoView({
      el: $('.js-user-info')
    });
    userInfoView.render();
  });
});
