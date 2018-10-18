var cdb = require('cartodb.js-v3');
var EmbedMapDetailsView = require('./embed_map_details_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_content');
  },

  render: function () {
    this.$el.html(this.template());

    var detailsView = new EmbedMapDetailsView({
      liked: this.options.liked,
      likes: this.options.likes,
      owner: this.options.owner,
      currentUser: this.options.currentUser,
      vizID: this.options.vizID
    });
    this.$el.append(detailsView.render().el);
    this.addView(detailsView);
    return this;
  }
});
