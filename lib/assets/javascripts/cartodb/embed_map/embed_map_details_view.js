var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Carto = require('../../carto-node/index.js.babel');

var DASHBOARD_TEMPLATE = _.template('<%- baseURL %>/me?utm_source=Footer_Link&utm_medium=referral&utm_campaign=Embed_v1&utm_content=<%- username %>');
var likeURLTemplate = _.template('api/v1/viz/<%= uuid %>/like');

module.exports = cdb.core.View.extend({
  className: 'cartodb-text',

  events: {
    'click .js-like': '_likeHandler'
  },

  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_details');
    this.owner = this.options.owner;
    this.likeURL = likeURLTemplate({
      uuid: this.options.vizID
    });
    this.client = new Carto.PublicClient();
    this._initModels();
  },

  _initModels: function () {
    this.viewModel = new cdb.core.Model({
      likes: this.options.likes,
      liked: this.options.liked
    });

    this.viewModel.on('change', this.render, this);
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

    this.$el.html(this.template({
      userDashboard: userDashboard,
      username: username,
      avatarUrl: this.owner.get('avatar_url'),
      likes: this.viewModel.get('likes'),
      liked: this.viewModel.get('liked')
    }));
  },

  _likeHandler: function () {
    this.client.get([this.likeURL], function (error, response) {
      if (error) {
        return;
      }

      var result = response.responseJSON;
      this.viewModel.set({
        likes: result.likes,
        liked: result.liked
      });
    }.bind(this));
  }
});
