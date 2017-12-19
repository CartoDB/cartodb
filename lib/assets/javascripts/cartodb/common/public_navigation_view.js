var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var markdown = require('markdown');
var Utils = require('cdb.Utils');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');
var UserShareView = require('../public_common/user_share_view');

var LOGIN_TEMPLATE = '/';
var LIKE_API_TEMPLATE = _.template('api/v1/viz/<%= uuid %>/like');
var LIKE_TEMPLATE = _.template('<%= baseURL %>/api/v1/viz/<%= uuid %>/like');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-Navmenu-link--download-map': '_exportMap'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('public/views/public_navigation');
    this.client = new CartoNode.PublicClient();
    this._initModels();
  },

  render: function () {
    var baseUrl = this.user.get('base_url');
    var createdByInfo = 'Map created by ' + this.user.get('username') + ' in CARTO';
    var description = this.vizdata.description
      ? Utils.stripHTML(markdown.toHTML(this.vizdata.description) + ' ' + createdByInfo)
      : createdByInfo;

    var encodedName = window.encodeURI(this.vizdata.name);
    var encodedUrl = window.encodeURI(baseUrl + '/viz/' + this.vizdata.id + '/public_map');
    var encodedDescription = window.encodeURI(description);

    this.clearSubViews();

    this.$el.html(this.template({
      baseUrl: baseUrl,
      editUrl: baseUrl + '/viz/' + this.vizdata.id + '/map',
      embedMapUrl: baseUrl + '/viz/' + this.vizdata.id + '/embed_map',
      likesCount: this.likeModel.get('likes'),
      likeURL: this.likeURL,
      liked: this.likeModel.get('liked'),
      shareFacebook: encodedUrl,
      shareLinkedIn: encodedUrl + '&title=' + encodedName + '&summary=' + encodedDescription + '&source=CARTO',
      shareTwitter: encodedName + '&url=' + encodedUrl + '&via=CARTO',
      userAvatar: this.user.get('avatar_url'),
      userName: this.user.nameOrUsername(),
      vizId: this.vizdata.id
    }));

    if (this.currentUser && this.currentUser.get('username') === this.user.get('username')) {
      this.$('.js-Navmenu-editLink').addClass('is-active');
    }

    this.userShareView = new UserShareView({
      el: this.$('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });
    this.addView(this.userShareView);

    this.likesView = new cdb.open.LikeView({
      el: this.$('.js-like'),
      auto_fetch: true,
      model: this.likeModel
    });
    this.addView(this.likesView);

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
    this.data = this.options.data;

    this.needLogin = this.currentUser == null;
    this.likeURL = this.needLogin ? LOGIN_TEMPLATE : LIKE_TEMPLATE({
      baseURL: this.user.get('base_url'),
      uuid: this.vizdata.id
    });

    this.likeModel = cdb.open.Like.newByVisData({
      size: 'big',
      url: this.likeURL,
      vis_id: this.vizdata.id,
      liked: this.vizdata.liked
    });
    this.likeModel.on('change', this.render, this);
    this.add_related_model(this.likeModel);
  },

  _exportMap: function (event) {
    event.preventDefault();

    var $mapView = new ExportMapView({
      model: new cdb.admin.ExportMapModel({
        visualization_id: this.vizdata.id
      }),
      clean_on_hide: true,
      enter_to_confirm: true
    });

    this.addView($mapView);

    $mapView.appendToBody();
  }
});
