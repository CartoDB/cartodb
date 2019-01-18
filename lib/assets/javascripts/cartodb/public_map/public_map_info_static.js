var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var markdown = require('markdown');
var moment = require('moment');
var UserMetaView = require('../public_common/user_meta_view');
var MapCardPreview = require('../common/views/mapcard_preview');
var PublicMapDatasetsView = require('./public_map_datasets_static');
var Utils = require('cdb.Utils');

var VISIBLE_TAG_COUNT = 3;
var VISUALIZATION_NUMBER = 3;

function _parsedTags (tags) {
  return _.first(tags, VISIBLE_TAG_COUNT);
}

function _overflowTags (tags) {
  return tags > VISIBLE_TAG_COUNT
    ? tags - VISIBLE_TAG_COUNT
    : null;
}

function _parsedDescription (description) {
  return description
    ? Utils.stripHTML(markdown.toHTML(description))
    : '';
}

function _totalMapViews (stats) {
  var viewsCount = _.values(stats);

  return _.reduce(viewsCount, function (views, statCount) {
    return statCount
      ? views + statCount
      : views;
  });
}

function _getMapCardsRepeat (count) {
  return ((VISUALIZATION_NUMBER * 2 - count) % VISUALIZATION_NUMBER);
}

function _addVisualizationData (visualization, mapOwnerUser) {
  return _.extend(visualization, {
    publicMapUrl: mapOwnerUser.get('base_url') + '/viz/' + visualization.id + '/public_map',
    updatedAt: moment(visualization.updated_at).fromNow()
  });
}

function _addMapcardPreview (index, element) {
  var $mapCard = $(element);
  var visData = $mapCard.data();

  if (visData.visId) {
    var mapCardPreview = new MapCardPreview({
      el: $mapCard.find('.js-header'),
      visId: visData.visId.toString(),
      username: visData.visOwnerName,
      mapsApiResource: cdb.config.getMapsResourceName(visData.visOwnerName)
    });

    mapCardPreview.load();
  }
}

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_info');
    this._initModels();
  },

  render: function () {
    var description = _parsedDescription(this.vizdata.description);
    var parsedTags = _parsedTags(this.vizdata.tags);
    var totalMapViews = _totalMapViews(this.vizdata.stats);
    var overflowTags = _overflowTags(this.vizdata.tags.length);
    var disqusShortname = this.currentUser
      ? this.currentUser.get('disqus_shortname')
      : null;
    var disqusIdentifier = this.vizdata.id;
    var disqusPageTitle = this.vizdata.name;
    var $mapCards;

    this.$el.html(this.template({
      description: description,
      disqusIdentifier: disqusIdentifier,
      disqusShortname: disqusShortname,
      tags: parsedTags,
      mapCardsRepeat: _getMapCardsRepeat(this.visualizations.count),
      mapViews: 0,
      moreVisualizations: this.moreVisualizations,
      nameOrUsername: this.mapOwnerUser.nameOrUsername(),
      username: this.mapOwnerUser.get('username'),
      mapname: this.vizdata.name,
      overflowTags: overflowTags,
      showVisualizations: this.showVisualizations,
      tagUrl: this.mapOwnerUser.get('base_url') + '/' + this.mapOwnerUser.get('username') + '/tag',
      totalMapViews: totalMapViews,
      updatedAt: moment(this.vizdata.updated_at).fromNow(),
      user: this.currentUser
    }));

    this.publicMapDatasetsView = new PublicMapDatasetsView({
      el: this.$('.js-PublicMapDatasets'),
      relatedCanonicalVisualizations: this.options.vizdata.related_canonical_visualizations,
      relatedCanonicalVisualizationsCount: this.options.vizdata.related_canonical_visualizations_count,
      mapOwnerUser: this.mapOwnerUser
    });
    this.addView(this.publicMapDatasetsView);

    this.userMetaView = new UserMetaView({
      el: this.$('.js-user-meta'),
      model: new cdb.core.Model({
        active: false
      })
    });
    this.addView(this.userMetaView);

    if (disqusShortname) {
      var disqusTemplate = cdb.templates.getTemplate('common/views/disqus');
      this.$('.js-disqus').html(disqusTemplate({
        disqusShortname: disqusShortname,
        disqusIdentifier: disqusIdentifier,
        disqusPageTitle: disqusPageTitle
      }));
    }

    $mapCards = this.$('.MapCard');

    if ($mapCards.length) {
      $mapCards.each(_addMapcardPreview);
    }

    this.publicMapDatasetsView.render();

    return this;
  },

  _initModels: function () {
    var visualizations = this.options.visualizations;
    var visId = this.options.vizdata.id;

    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
    this.mapOwnerUser = this.options.mapOwnerUser;
    this.visualizations = _.filter(visualizations, function (visualization) {
      return visualization.id !== visId;
    });
    this.moreVisualizations = this._setMoreVisualizations();
    this.showVisualizations = !!this.moreVisualizations.length;
  },

  _setMoreVisualizations: function () {
    var visualizations = this.visualizations;
    var mapOwnerUser = this.mapOwnerUser;
    var PRIVACY_PUBLIC = 'PUBLIC';

    return _
      .first(visualizations, VISUALIZATION_NUMBER)
      .filter(function (visualization) {
        return visualization.privacy === PRIVACY_PUBLIC;
      })
      .map(function (visualization) {
        return _addVisualizationData(visualization, mapOwnerUser);
      });
  }
});
