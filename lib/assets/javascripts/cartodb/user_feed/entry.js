var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var UserSettingsView = require('../public_common/user_settings_view');
var Feed = require('../common/views/feed/view');

/**
 * Entry point for the user feed, bootstraps all dependency models and application.
 */
$(function() {
  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', window.base_url);

    var authenticatedUser = new cdb.open.AuthenticatedUser();

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
    });

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

    var feed = new Feed({
      el: $('.js-feed'),
      avatarURL: avatar_url
    });

    feed.render();
    authenticatedUser.fetch();
  });
});
