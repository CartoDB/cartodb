var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');
var markdown = require('markdown');

module.exports = cdb.core.View.extend({
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

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.currentUser = this.options.currentUser;
    this.vizId = this.options.vizId;
    this.vizdata = this.options.vizdata;
    this.data = this.options.data;
  }
});
