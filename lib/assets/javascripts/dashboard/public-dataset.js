const Backbone = require('backbone');
const _ = require('underscore');
const $ = require('jquery');
const ConfigModel = require('dashboard/data/config-model');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const LikeModel = require('dashboard/data/like-model');
const LikeView = require('dashboard/components/likes/like-view');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const UserMetaView = require('dashboard/components/user-meta-view/user-meta-view');

const configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url
    },
    window.config
  )
);

$(function () {
  new UserIndustriesView({ // eslint-disable-line no-new
    el: $('.js-user-industries')
  });

  new UserMetaView({ // eslint-disable-line no-new
    el: $('.js-user-meta'),
    model: new Backbone.Model({
      active: false
    })
  });

  const authenticatedUser = new AuthenticatedUser();
  authenticatedUser.bind('change', function () {
    if (authenticatedUser.get('user_data')) {
      const user = new UserModel(authenticatedUser.attributes.user_data);
      const userSettingsView = new UserSettingsView({
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

  $('.MapCard').each(function () {
    const visId = $(this).data('visId');
    if (visId) {
      const username = $(this).data('visOwnerName');
      const mapCardPreview = new MapCardPreview({
        el: $(this).find('.js-header'),
        visId: $(this).data('visId'),
        username: username,
        mapsApiResource: configModel.getMapsResourceName(username)
      });
      mapCardPreview.load();
    }
  });

  $('.js-likes').each(function () {
    const likeModel = LikeModel.newByVisData({
      config: configModel,
      likeable: false,
      vis_id: $(this).data('vis-id'),
      likes: $(this).data('likes-count'),
      size: $(this).data('likes-size')
    });
    authenticatedUser.bind('change', function () {
      if (authenticatedUser.get('user_data')) {
        likeModel.bind('sync', function () {
          likeModel.set('likeable', true);
        });
        likeModel.fetch();
      }
    });
    const likeView = new LikeView({
      el: this,
      model: likeModel
    });
    likeView.render();
  });

  authenticatedUser.fetch();
});
