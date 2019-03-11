// embed map details
var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

var DASHBOARD_TEMPLATE = _.template('<%= baseURL %>/me?utm_source=Footer_Link&utm_medium=referral&utm_campaign=Embed_v1&utm_content=<%- username %>');
var LOGIN_TEMPLATE = '/';

module.exports = cdb.core.View.extend({
  className: 'cartodb-text',

  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_details');
    this.owner = this.options.owner;
    this.currentUser = this.options.currentUser;
    this.needLogin = this.currentUser == null;
    this.client = new CartoNode.PublicClient();
    this._initModels();
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
      userDashboard: userDashboard,
      username: username,
      uuid: this.options.vizID,
      avatarUrl: this.owner.get('avatar_url'),
    }));
  }
});
