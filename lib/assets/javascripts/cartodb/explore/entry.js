var $ = require('jquery');
var cdb = require('cartodb.js');
var UserSettingsView = require('../public_common/user_settings_view');
var UserTourView = require('../public_common/user_tour_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserResourcesView = require('../public_common/user_resources_view');
var FavMapView = require('../public_dashboard/fav_map_view');
var Explore = require('../common/views/explore/view');

var Items = Backbone.Collection.extend({
  url: 'http://common-data.cartodb.com/api/v2/sql'
});

/**
 * Entry point for the user feed, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.base_url);

    new UserTourView({
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

    this.f = new Items();
    this.f.bind('reset', function() {
      var r = this.f.models[0].attributes.rows[0]

      var url = '//' + r.username + '.cartodb.com/api/v2/viz/' + r.id + '/viz.json';
     this.$('.js-mapTitle').text(r.name);
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
     this.$('.js-favMapTitle').removeClass('is-hidden');

    }, this);

    var fields = [
      'visualization_mapviews::numeric/(1.0 + (now()::date - visualization_created_at::date)::numeric)^2 As r',
      'visualization_name AS name',
      'user_username AS username',
      'visualization_id AS id',
      'visualization_likes AS likes',
      'visualization_title AS title'
    ].join(',');

    var q = 'SELECT ' + fields + ' FROM visualizations ORDER BY r DESC LIMIT 1';
    var data = _.extend({ q: q });
    this.f.fetch({
      data: data
    });

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
