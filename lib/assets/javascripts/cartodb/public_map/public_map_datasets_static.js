var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var moment = require('moment');
var markdown = require('markdown');
var Utils = require('cdb.Utils');

var _publicDatasets = function (owner, datasets) {
  var PRIVACY_PUBLIC = 'PUBLIC';

  return datasets && datasets.length ? _.filter(datasets, function (dataset) {
    if (dataset.privacy === PRIVACY_PUBLIC) {
      return _addDatasetData(dataset, owner);
    }
  }) : [];
};

var _addDatasetData = function (dataset, mapOwnerUser) {
  return _.extend(dataset, {
    avatar_url: mapOwnerUser.get('avatar_url'),
    username: mapOwnerUser.get('username'),
    nameOrUsername: mapOwnerUser.nameOrUsername(),
    publicTableUrl: mapOwnerUser.get('base_url') + '/tables/' + dataset.name + '/public',
    addLikeUrl: mapOwnerUser.get('base_url') + '/viz/' + dataset.id + '/like',
    updatedAt: moment(dataset.updated_at).fromNow(),
    parsedDescription: _parsedDescription(dataset.description)
  });
};

var _parsedDescription = function (description) {
  return description
    ? Utils.stripHTML(markdown.toHTML(description))
    : null;
};

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_datasets');
    this._initModels();
  },

  render: function () {
    var mapOwnerUser = this.options.mapOwnerUser;
    this.$el.html(this.template({
      publicDatasets: this.publicDatasets,
      nonPublicDatasetsCount: this.nonPublicDatasetsCount,
      nameOrUsername: mapOwnerUser.nameOrUsername(),
      username: mapOwnerUser.get('username')
    }));
  },

  _initModels: function () {
    var datasetsCount = this.options.relatedCanonicalVisualizationsCount;
    var datasets = this.options.relatedCanonicalVisualizations
      ? this.options.relatedCanonicalVisualizations
      : [];

    var mapOwnerUser = this.options.mapOwnerUser;
    this.publicDatasets = _publicDatasets(mapOwnerUser, datasets);
    this.nonPublicDatasetsCount = datasetsCount - this.publicDatasets.length;
  }
});
