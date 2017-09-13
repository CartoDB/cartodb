var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_content');
  },

  render: function () {
    // TODO
    this.$el.html(this.template({
      isPublic: true,
      isPublicWithLink: false,
      isPasswordProtected: false,
      isOrganization: false,
      publicUserFeedHomeUrl: '',
      username: '',
      avatarUrl: '',
      name: '',
      likes: 0
    }));

    return this;
  }
});
