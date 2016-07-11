var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserSettingsView = require('./public_common/user_settings_view');
var UserIndustriesView = require('./public_common/user_industries_view');
var MapCardPreview = require('./common/views/mapcard_preview');
var LikeView = require('./common/views/likes/view');
var UserMetaView = require('./public_common/user_meta_view');

/*
 * needed for new modals to be used in older js views,
 * cdb.editor namespace is needed for dependencies in export view
 *
 */

cdb.editor = {
  PublicExportView: require('./common/dialogs/export/public_export_view'),
  randomQuote: require('./common/view_helpers/random_quote.js'),
  ViewFactory: require('./common/view_factory')
}

$(function() {
  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config);
    cdb.config.set('url_prefix', window.base_url);

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries')
    });

    var userMetaView = new UserMetaView({
      el: $('.js-user-meta'),
      model: new cdb.core.Model({
        active: false
      })
    });

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
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

        $('.js-login').hide();
        $('.js-learn').show();

        if (user.get('username') === window.owner_username) {
          // Show "Edit in CartoDB" button if logged user
          // is the map owner ;)
          $('.js-edit').css('display', 'inline-block');
          $('.js-oneclick').hide();
        }
      }
    });

    $('.MapCard').each(function() {
      var visId = $(this).data('visId');
      if (visId) {
        var username = $(this).data('visOwnerName');
        var mapCardPreview = new MapCardPreview({
          el: $(this).find('.js-header'),
          visId: $(this).data('visId'),
          username: username,
          mapsApiResource: cdb.config.getMapsResourceName(username)
        });
        mapCardPreview.load();
      }
    });

    $('.js-likes').each(function() {
      var likeModel = cdb.admin.Like.newByVisData({
        likeable: false,
        vis_id: $(this).data('vis-id'),
        likes: $(this).data('likes-count'),
        size: $(this).data('likes-size')
      });
      authenticatedUser.bind('change', function() {
        if (authenticatedUser.get('username')) {
          likeModel.bind('loadModelCompleted', function() {
            likeModel.set('likeable', true);
          });
          likeModel.fetch();
        }
      });
      var likeView = new LikeView({
        el: this,
        model: likeModel
      });
      likeView.render();
    });

    authenticatedUser.fetch();
  });

});
