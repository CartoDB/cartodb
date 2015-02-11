var $ = require('jquery');
var cdb = require('cartodb.js');
var FavMapView = require('./fav_map_view');
var UserInfoView = require('./user_info_view');
var PaginationModel = require('new_common/views/pagination/model');
var PaginationView = require('new_common/views/pagination/view');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    $(document.body).bind('click', function () {
      cdb.god.trigger('closeDialogs');
    });

    var favMapView = new FavMapView(window.favMapViewAttrs);
    favMapView.render();

    var userInfoView = new UserInfoView({
      el: $('.js-user-info')
    });
    userInfoView.render();

    var paginationView = new PaginationView({
      el: '.js-content-footer',
      model: new PaginationModel(window.paginationModelAttrs)
    });
    paginationView.render();
  });
});
