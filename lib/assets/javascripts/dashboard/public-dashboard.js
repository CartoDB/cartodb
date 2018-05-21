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
    new ScrollableHeader({ // eslint-disable-line no-new
      el: headerEl,
      anchorPoint: 350
    });
  }

  new UserIndustriesView({ // eslint-disable-line no-new
    el: $('.js-user-industries')
  });

  const authenticatedUser = new AuthenticatedUser();

  authenticatedUser.on('change', function (model) {
    if (model.get('username')) {
      var user = new UserModel(authenticatedUser.attributes, {
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
    el: $('.js-content-footer'),
    model: new PaginationModel(window.paginationModelAttrs)
  });
  paginationView.render();

  $('.MapCard').each(function () {
    const mapCard = $(this);
    const visId = mapCard.data('visId');
    if (visId) {
      const username = mapCard.data('visOwnerName');
      const mapCardPreview = new MapCardPreview({
        el: mapCard.find('.js-header'),
        height: 220,
        visId: mapCard.data('visId'),
        username: username,
        mapsApiResource: configModel.getMapsResourceName(username),
        config: configModel
      });
      mapCardPreview.load();
    }
  });

  $('.js-likes').each(function () {
    const likeElement = $(this);
    const likeModel = LikeModel.newByVisData({
      config: configModel,
      url: !configModel.get('url_prefix') ? likeElement.attr('href') : '',
      likeable: false,
      show_count: likeElement.data('show-count') || false,
      show_label: likeElement.data('show-label') || false,
      vis_id: likeElement.data('vis-id'),
      likes: likeElement.data('likes-count')
    });
    authenticatedUser.bind('change', function (model) {
      if (model.get('username')) {
        likeModel.once('change', function () {
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
