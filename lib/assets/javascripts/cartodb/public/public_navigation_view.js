var cdb = require('cartodb.js-v3');
var markdown = require('markdown');
var Utils = require('cdb.Utils');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');
var LikeView = require('../common/views/likes/view');
var UserShareView = require('../public_common/user_share_view');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-Navmenu-link--download-map': '_exportMap'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('public/views/public_navigation');
    this._initModels();
  },

  render: function () {
    var baseUrl = this.user.get('base_url');
    var createdByInfo = 'Map created by ' + this.user.get('username') + ' in CARTO';
    var description = this.vizdata.description
      ? Utils.stripHTML(markdown.toHTML(this.vizdata.description) + ' ' + createdByInfo)
      : createdByInfo;
    var encodedName = window.encodeURI(this.vizdata.name);
    var encodedUrl = window.encodeURI(baseUrl + '/viz/' + this.vizId + '/public_map');
    var encodedDescription = window.encodeURI(description);

    this.clearSubViews();

    this.$el.html(this.template({
      baseUrl: baseUrl,
      embedMapUrl: baseUrl + '/viz/' + this.vizId + '/embed_map',
      liked: this.vizdata.liked,
      likesCount: this.vizdata.likes,
      likeUrl: this.user ? '#/like' : baseUrl + '/login',
      shareFacebook: encodedUrl,
      shareLinkedIn: encodedUrl + '&title=' + encodedName + '&summary=' + encodedDescription + '&source=CARTO',
      shareTwitter: encodedName + '&url=' + encodedUrl + '&via=CARTO',
      userAvatar: this.user.get('avatar_url'),
      userName: this.user.nameOrUsername(),
      vizId: this.vizId
    }));

    if (this.user.get('username') === this.currentUser.get('username')) {
      this.$('.js-Navmenu-editLink').addClass('is-active');
    }

    this.$('.js-likes').each(function () {
      _addLikeView.call(this);
    });

    this.userShareView = new UserShareView({
      el: this.$('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.currentUser = this.options.currentUser;
    this.vizId = this.options.vizId;
    this.vizdata = this.options.vizdata;
    this.data = this.options.data;
  },

  _exportMap: function (event) {
    event.preventDefault();

    var mapModel = new cdb.admin.ExportMapModel({
      visualization_id: this.vizdata.id
    });

    var $mapView = new ExportMapView({
      model: mapModel,
      clean_on_hide: true,
      enter_to_confirm: true
    });

    $mapView.appendToBody();
  }
});

function _addLikeView () {
  var likeModel = cdb.admin.Like.newByVisData({
    likeable: true,
    liked: $(this).data('liked'),
    vis_id: $(this).data('vis-id'),
    likes: $(this).data('likes-count'),
    size: $(this).data('likes-size')
  });

  var likeView = new LikeView({
    el: this,
    model: likeModel
  });

  likeView.render();
}
