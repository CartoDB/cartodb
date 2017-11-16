var cdb = require('cartodb.js-v3');

var DASHBOARD_TEMPLATE = 'http://wadus.localhost.lan:3000/u/buti/me?utm_source=Footer_Link&utm_medium=referral&utm_campaign=Embed_v1&utm_content=buti';

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_content');
  },

  render: function () {
    // TODO: fill conditions to be visible
    var isVisible = true;
    var userDashboard = DASHBOARD_TEMPLATE;

    if (isVisible) {
      this.$el.html(this.template({
        userDashboard: userDashboard,
        username: 'buti',
        avatarUrl: 'https://s3.amazonaws.com/com.cartodb.users-assets.production/production/butilon/assets/201605180747041349978691.jpg',
        name: 'buti',
        likes: 3
      }));
    }

    return this;
  }
});
