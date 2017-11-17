var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Carto = require('../../carto-node/index.js.babel');

var DASHBOARD_TEMPLATE = _.template('<%- baseURL %>/me?utm_source=Footer_Link&utm_medium=referral&utm_campaign=Embed_v1&utm_content=<%- username %>');
var likeURLTemplate = _.template('api/v1/viz/<%= uuid %>/like');

module.exports = cdb.core.View.extend({
  events: {
    'click .js-like': '_likeHandler'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_content');
    this.likes = this.options.likes;
    this.owner = this.options.owner;
    this.likeURL = likeURLTemplate({
      uuid: this.options.vizID
    });
    this.client = new Carto.PublicClient();
  },

  render: function () {
    var username = this.owner.get('username');
    var userDashboard = DASHBOARD_TEMPLATE({
      baseURL: this.owner.get('base_url'),
      username: username
    });

    this.$el.html(this.template({
      userDashboard: userDashboard,
      username: username,
      avatarUrl: this.owner.get('avatar_url'),
      likes: this.likes,
      liked: this.liked
    }));

    return this;
  },

  _likeHandler: function () {
    this.client.get([this.likeURL], function (error, response) {
      if (error) {
        return;
      }

      var result = response.responseJSON;
      this.liked = result.liked;
      this.likes = result.likes;
      this.render();
    }.bind(this));
  }
});
