var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserSettingsView = require('../public_common/user_settings_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var FavMapView = require('../public_dashboard/fav_map_view');
var Explore = require('./view');
var ExploreModel = require('./model');

/**
 * Entry point for the user feed, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config);
    cdb.config.set('url_prefix', window.base_url);
    cdb.config.set('login_url', window.login_url);

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries')
    });

    // Sets default login URL in the header
    $('.js-login a').attr('href', cdb.config.get('login_url'));

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

    this.exploreModel = new ExploreModel();

    var self = this;

    var onSuccess = function(model) {
      if (!model) {
        return;
      }

      var visURL = '//' + model.get('username') + '.' + cdb.config.get('account_host') + '/api/v2/viz/' + model.get('id') + '/viz.json';

      var url = '//' + model.get('username') + '.' + cdb.config.get('account_host') + '/viz/' + model.get('id') + '/public_map';
      self.$('.js-mapTitle').attr('href', url);
      self.$('.js-mapTitle').text(model.get('name'));

      var favMapView = new FavMapView({
        el: '#fav-map-container',
        createVis: {
          url: visURL,
          opts: {
            annotation: true
          }
        }
      });

      favMapView.render();
      self.$('.js-favMapTitle').removeClass('is-hidden');
    };

    this.exploreModel.fetch({ success: onSuccess });

    var authenticatedUser = new cdb.open.AuthenticatedUser({ host: cdb.config.get('explore_user') + '.' + cdb.config.get('account_host')});

    authenticatedUser.sync = Backbone.withCORS;

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
