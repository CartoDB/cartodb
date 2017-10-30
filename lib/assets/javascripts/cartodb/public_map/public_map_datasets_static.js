var _ = require('underscore');
var cdb = require('cartodb.js-v3');
var moment = require('moment');
var markdown = require('markdown');
var Utils = require('cdb.Utils');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public_map/views/public_map_datasets');
    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      publicDatasets: this.publicDatasets,
      nonPublicDatasetsCount: this.nonPublicDatasetsCount,
      nameOrUsername: this.mapOwnerUser.nameOrUsername(),
      username: this.mapOwnerUser.get('username')
    }));
  },

  _initModels: function () {
    var datasets = this.options.relatedCanonicalVisualizations
      ? this.options.relatedCanonicalVisualizations
      : [];

    this.mapOwnerUser = this.options.mapOwnerUser;
    this.publicDatasets = _publicDatasets.call(this, datasets);
    this.nonPublicDatasetsCount = datasets.length - this.publicDatasets.length;
  }
});

var _publicDatasets = function (datasets) {
  var PRIVACY_PUBLIC = 'PUBLIC';
  var mapOwnerUser = this.mapOwnerUser;

  return datasets && datasets.length
    ? _.filter(datasets, function (dataset) {
        if (dataset.privacy === PRIVACY_PUBLIC) {
          return _addDatasetData(dataset, mapOwnerUser);
        }
      })
    : [];
}

var _addDatasetData = function (dataset, mapOwnerUser) {
  return _.extend(dataset, {
    avatar_url: mapOwnerUser.get('avatar_url'),
    username: mapOwnerUser.get('username'),
    nameOrUsername: mapOwnerUser.nameOrUsername(),
    publicTableUrl: mapOwnerUser.get('base_url') + '/tables/' + dataset.name + '/public',
    addLikeUrl: mapOwnerUser.get('base_url') + '/viz/' + dataset.id + '/like',
    updatedAt: moment(dataset.updated_at).fromNow(),
    parsedDescription: _parsedDescription(dataset.description),
    rowsCounted: 0, // TODO
    rowsCountedParsed: [], // TODO _parsedRowsCounted
    geometryTypeClass: '' // TODO
  })
}

var _parsedDescription = function (description) {
  return description
    ? Utils.stripHTML(markdown.toHTML(description))
    : null;
}

var _parsedRowsCounted = function (count) {
  return count && count.length
    ? Utils.readizableNumber(count.length)
    : null;
}
