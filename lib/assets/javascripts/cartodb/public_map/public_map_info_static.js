var cdb = require('cartodb.js-v3');
var _ = require('underscore');
var Utils = require('cdb.Utils');
var markdown = require('markdown');
var moment = require('moment');

var VISIBLE_TAG_COUNT = 3;

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_info');
    this._initModels();
  },

  render: function () {
    var description = _formattedDescription.call(this, this.vizdata.description);
    var formattedTags = _formattedTags.call(this, this.vizdata.tags);
    var totalMapViews = _totalMapViews.call(this, this.vizdata.stats);
    var overflowTags = _overflowTags.call(this, this.vizdata.tags.length);
    var disqusShortname = this.currentUser.get('disqus_shortname');
    var disqusIdentifier = this.vizdata.id;
    var disqusPageTitle = this.vizdata.name;

    this.$el.html(this.template({
      ago: moment(this.vizdata.updated_at).fromNow(),
      description: description,
      disqusShortname: disqusShortname,
      disqusIdentifier: disqusIdentifier,
      formattedTags: formattedTags,
      mapViews: 0,
      name: this.vizdata.name,
      overflowTags: overflowTags,
      tagUrl: this.currentUser.get('base_url') + '/' + this.currentUser.get('username') + '/tag',
      updatedAt: this.vizdata.updated_at,
      user: this.currentUser,
      totalMapViews: totalMapViews
    }));

    if (disqusShortname) {
      var disqusTemplate = cdb.templates.getTemplate('common/views/disqus');
      this.$('.js-disqus').html(disqusTemplate({
        disqusShortname: disqusShortname,
        disqusIdentifier: disqusIdentifier,
        disqusPageTitle: disqusPageTitle
      }));
    }

    return this;
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
  }
});

function _formattedTags (tags) {
  return _.first(tags, VISIBLE_TAG_COUNT);
}

function _overflowTags (tags) {
  return tags > VISIBLE_TAG_COUNT
    ? tags - VISIBLE_TAG_COUNT
    : null;
}

function _formattedDescription (description) {
  return description
    ? Utils.stripHTML(markdown.toHTML(description))
    : '';
}

function _totalMapViews (stats) {
  var viewsCount = _.values(stats);
  return _.reduce(viewsCount, function (views, statCount) {
    return views + statCount;
  });
}
