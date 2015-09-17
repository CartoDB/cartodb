var $ = require('jquery');
var cdb = require('cartodb.js');
var UserSettingsView = require('../public_common/user_settings_view');
var UserTourView = require('../public_common/user_tour_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserResourcesView = require('../public_common/user_resources_view');
var FavMapView = require('../public_dashboard/fav_map_view');
var Explore = require('./view');
var ExploreModel = require('./model');

/**
 * Entry point for the user feed, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.base_url);

    var tourView = new UserTourView({
      el: $('.js-user-tour')
    });

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries')
    });

    var userResourcesView = new UserResourcesView({
      el: $('.js-user-resources')
    });

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    this.exploreModel = new ExploreModel();

    var self = this;

    var onSuccess = function(model) {
      if (!model) {
        return;
      }

      var url = '//' + model.get('username') + '.cartodb.com/api/v2/viz/' + model.get('id') + '/viz.json';

      self.$('.js-mapTitle').text(model.get('name'));

      var favMapView = new FavMapView({
        el: '#fav-map-container',
        createVis: {
          url: url,
          opts: {
            no_cdn: true
          }
        }
      });

      favMapView.render();
      self.$('.js-favMapTitle').removeClass('is-hidden');

    };

    this.exploreModel.fetch({ success: onSuccess });

    var authenticatedUser = new cdb.open.AuthenticatedUser();

    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);
        var userSettingsView = new UserSettingsView({
          el: $('.js-user-settings'),
          model: user
        });
        userSettingsView.render();

        var userDashboardUrl = user.viewUrl().dashboard();
        $('.js-user-info .UserAvatar-img').wrap($('<a>', {
          href: userDashboardUrl
        }));

        $('.js-login').hide();
        $('.js-learn').show();
      }
    });

    var feed = new Explore({
      el: $('.js-explore'),
      authenticatedUser: authenticatedUser
    });

    feed.render();
    authenticatedUser.fetch();
  });
});
