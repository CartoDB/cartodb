var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var markdown = require('markdown');
var Utils = require('cdb.Utils');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');
var LikeView = require('../common/views/likes/view');
var UserShareView = require('../public_common/user_share_view');

function _addLikeView (element) {
  var el = $(element);
  var likeModel = cdb.admin.Like.newByVisData({
    likeable: true,
    liked: el.data('liked'),
    likes: el.data('likes-count'),
    size: el.data('likes-size'),
    vis_id: el.data('vis-id')
  });

  var likeView = new LikeView({
    el: element,
    model: likeModel
  });

  this.addView(likeView);

  likeView.render();
}

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
    var encodedUrl = window.encodeURI(baseUrl + '/viz/' + this.vizdata.id + '/public_map');
    var encodedDescription = window.encodeURI(description);

    this.clearSubViews();

    this.$el.html(this.template({
      baseUrl: baseUrl,
      editUrl: baseUrl + '/tables/' + this.vizdata.id,
      embedMapUrl: baseUrl + '/viz/' + this.vizdata.id + '/embed_map',
      liked: this.vizdata.liked,
      likesCount: this.vizdata.likes,
      likeUrl: this.user ? baseUrl + '/viz/' + this.vizdata.id + '/like' : baseUrl + '/login',
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

    this.$('.js-likes').each(function (index, element) {
      _addLikeView.call(this, element);
    }.bind(this));

    this.userShareView = new UserShareView({
      el: this.$('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });
    this.addView(this.userShareView);

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
    this.data = this.options.data;
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
