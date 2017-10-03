var cdb = require('cartodb.js-v3');
var Utils = require('cdb.Utils');
var _ = require('underscore');
var markdown = require('markdown');
var moment = require('moment');

var VISIBLE_TAG_COUNT = 3;

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_info');
    this._initModels();
  },

  render: function () {
    var description = this.vizdata.description
      ? Utils.stripHTML(markdown.toHTML(this.vizdata.description))
      : '';

    var formattedTags = _formatTags.call(this, this.vizdata.tags);

    var overflowTags = this.vizdata.tags.length > VISIBLE_TAG_COUNT
      ? this.vizdata.tags.length - VISIBLE_TAG_COUNT
      : null;

    this.$el.html(this.template({
      ago: moment(this.vizdata.updated_at).fromNow(),
      description: description,
      disqusShortname: this.currentUser.get('disqus_shortname'),
      formattedTags: formattedTags,
      mapViews: 0,
      name: this.vizdata.name,
      overflowTags: overflowTags,
      tagUrl: this.currentUser.get('base_url') + '/' + this.currentUser.get('username') + '/tag',
      updatedAt: this.vizdata.updated_at,
      user: this.currentUser
    }));

    return this;
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
  }
});

function _formatTags (tags) {
  return _.first(tags, VISIBLE_TAG_COUNT);
}
