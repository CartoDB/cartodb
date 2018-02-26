const Backbone = require('backbone');
const $ = require('jquery');
const _ = require('underscore');
const ConfigModel = require('dashboard/data/config-model');
const AuthenticatedUser = require('dashboard/data/authenticated-user-model');
const UserModel = require('dashboard/data/user-model');
const FavMapView = require('dashboard/views/public-profile/fav-map-view');
const UserInfoView = require('dashboard/components/user-info/user-info-view');
const PaginationModel = require('builder/components/pagination/pagination-model');
const PaginationView = require('builder/components/pagination/pagination-view');
const UserSettingsView = require('dashboard/components/navbar/user-settings-view');
const UserIndustriesView = require('dashboard/components/navbar/user-industries-view');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const LikeView = require('dashboard/components/likes/like-view');
const LikeModel = require('dashboard/data/like-model');
const ScrollableHeader = require('dashboard/helpers/scroll-tofixed-view');
const Like = require('dashboard/components/likes/like.jsx');

const configModel = new ConfigModel(
  _.defaults(
    {
      base_url: window.base_url
    },
    window.config
  )
);

window.configModel = configModel;

$(function () {
  const headerEl = $('.js-Navmenu');
  if (headerEl.length > 0) {
    const scrollableHeader = new ScrollableHeader({ // eslint-disable-line no-unused-vars
      el: headerEl,
      anchorPoint: 350
    });
  }

  const userIndustriesView = new UserIndustriesView({ // eslint-disable-line no-unused-vars
    el: $('.js-user-industries')
  });

  const authenticatedUser = new AuthenticatedUser();

  authenticatedUser.on('change', function (model) {
    if (model.get('user_data')) {
      var user = new UserModel(authenticatedUser.attributes.user_data, {
        configModel: configModel
      });

      const userSettingsView = new UserSettingsView({
        el: $('.js-user-settings'),
        model: user
      });
      userSettingsView.render();

      $('.js-login').hide();
      $('.js-learn').show();
    }
  });

  const favMapView = new FavMapView(window.favMapViewAttrs);
  favMapView.render();

  const userInfoView = new UserInfoView({
    el: $('.js-user-info')
  });
  userInfoView.render();

  const paginationView = new PaginationView({
    el: '.js-content-footer',
    model: new PaginationModel(window.paginationModelAttrs)
  });
  paginationView.render();

  const RModel = new Backbone.Model({
    size: 8,
    likes: 8,
    show_label: false,
    show_count: true,
    onClick: function () { RModel.set('likes', RModel.get('likes') + 1); }
  });

  const RLike = new Like({
    model: RModel,
    el: $('.react-goes-here')
  });

  RLike.render();

  $('.MapCard').each(function () {
    const visId = $(this).data('visId');
    if (visId) {
      const username = $(this).data('visOwnerName');
      const mapCardPreview = new MapCardPreview({
        el: $(this).find('.js-header'),
        height: 220,
        visId: $(this).data('visId'),
        username: username,
        mapsApiResource: configModel.getMapsResourceName(username),
        config: configModel
      });
      mapCardPreview.load();
    }
  });

  $('.js-likes').each(function () {
    const likeModel = LikeModel.newByVisData({
      config: configModel,
      url: !configModel.get('url_prefix') ? $(this).attr('href') : '',
      likeable: false,
      show_count: $(this).data('show-count') || false,
      show_label: $(this).data('show-label') || false,
      vis_id: $(this).data('vis-id'),
      likes: $(this).data('likes-count')
    });
    authenticatedUser.bind('change', function () {
      if (authenticatedUser.get('username')) {
        likeModel.bind('loadModelCompleted', function () {
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
