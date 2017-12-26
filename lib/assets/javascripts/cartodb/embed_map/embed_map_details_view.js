// embed map details
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

var DASHBOARD_TEMPLATE = _.template('<%= baseURL %>/me?utm_source=Footer_Link&utm_medium=referral&utm_campaign=Embed_v1&utm_content=<%- username %>');
var LOGIN_TEMPLATE = '/';
var LIKE_API_TEMPLATE = _.template('api/v1/viz/<%= uuid %>/like');
var LIKE_TEMPLATE = _.template('<%= baseURL %>/api/v1/viz/<%= uuid %>/like');

module.exports = cdb.core.View.extend({
  className: 'cartodb-text',

  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_details');
    this.owner = this.options.owner;
    this.currentUser = this.options.currentUser;
    this.needLogin = this.currentUser == null;
    this.likeURL = this.needLogin ? LOGIN_TEMPLATE : LIKE_TEMPLATE({
      baseURL: this.owner.get('base_url'),
      uuid: this.options.vizID
    });

    this.client = new CartoNode.PublicClient();
    this._initModels();
  },

  _initModels: function () {
    this.likeModel = cdb.open.Like.newByVisData({
      url: this.likeURL,
      vis_id: this.options.vizID,
      likes: this.options.likes,
      liked: this.options.liked
    });

    this.likeModel.on('change', this.render, this);
    this.add_related_model(this.likeModel);
  },

  render: function () {
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var username = this.owner.get('username');
    var userDashboard = DASHBOARD_TEMPLATE({
      baseURL: this.owner.get('base_url'),
      username: username
    });

    this.clearSubViews();

    this.$el.html(this.template({
      likeURL: this.likeURL,
      userDashboard: userDashboard,
      username: username,
      uuid: this.options.vizID,
      avatarUrl: this.owner.get('avatar_url'),
      likes: this.likeModel.get('likes'),
      liked: this.likeModel.get('liked')
    }));

    this.likesView = new cdb.open.LikeView({
      el: this.$('.js-like'),
      auto_fetch: true,
      model: this.likeModel
    });
    this.addView(this.likesView);
  }
});
