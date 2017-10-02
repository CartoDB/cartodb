var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public/views/public_navigation');
    this._initModels();
  },

  render: function () {
    var baseUrl = this.user.get('base_url');
    this.clearSubViews();

    this.$el.html(this.template({
      userName: this.user.nameOrUsername(),
      userAvatar: this.user.get('avatar_url'),
      baseUrl: baseUrl,
      embedMapUrl: baseUrl + '/viz/' + this.vizId + '/embed_map',
      likesUrl: this.user ? '#/like' : baseUrl + '/login',
      vizId: this.vizId,
      shareTwitter: '', // TODO
      likesCount: 0 // FIXME
    }));

    return this;
  },

  _initModels: function () {
    this.user = this.options.user;
    this.vizId = this.options.vizId;
    this.vizdata = this.options.vizdata;
  },

  _addLike: function () {

  }
});
