var $ = require('jquery');
var cdb = require('cartodb.js');
var FavMapView = require('./fav_map_view');
var UserInfoView = require('./user_info_view');
var PaginationModel = require('new_common/views/pagination/model');
var PaginationView = require('new_common/views/pagination/view');
var UserUrl = require('new_common/urls/user_model');
var OrgUserUrl = require('new_common/urls/organization_user_model');
var UserSettingsView = require('new_public_dashboard/user_settings_view');
var MapCardPreview = require('new_dashboard/mapcard_preview');

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    var authenticatedUser = new cdb.open.AuthenticatedUser();
    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);
        var urlData = {
          user: user,
          account_host: window.account_host
        };
        var currentUserUrl;
        if (user.isOrgAdmin()) {
          currentUserUrl = new OrgUserUrl(urlData);
        } else {
          currentUserUrl = new UserUrl(urlData);
        }
        var userSettingsView = new UserSettingsView({
          el: $('.js-user-settings'),
          model: user,
          currentUserUrl: currentUserUrl
        });
        userSettingsView.render();
      }
    });
    authenticatedUser.fetch();

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

    $('.MapCard').each(function() {
      var mapCardPreview = new MapCardPreview({
        el: $(this).find('.js-header'),
        vizjson: $(this).attr('vizjson-url')
      });
      mapCardPreview.load();
    });

  });
});
