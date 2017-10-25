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

    this.publicDatasets = _publicDatasets.call(this, datasets);
    this.nonPublicDatasetsCount = datasets.length - this.publicDatasets.length;

    this.mapOwnerUser = this.options.mapOwnerUser;
  }
});

var _publicDatasets = function (datasets) {
  var PRIVACY_PUBLIC = 'PUBLIC';

  return datasets && datasets.length
    ? _.filter(datasets, function (dataset) {
        if (dataset.privacy === PRIVACY_PUBLIC) {
          return _addDatasetData(dataset);
        }
      })
    : [];
}

var _addDatasetData = function (dataset) {
  return _.extend(dataset, {
    avatar_url: dataset.permission.owner.avatar_url,
    username: dataset.permission.owner.username,
    nameOrUsername: _nameOrUsername(dataset.permission.owner),
    publicTableUrl: '', // TODO CartoDB.url(self, 'public_table', {id: vis.user_table.name}, @user_domain.nil? ? nil : @related_tables_owners[vis.user_table.user_id])
    addLikeUrl: '', // TODO CartoDB.url(self, 'api_v1_visualizations_add_like', {id: vis.id}, vis.user)
    updatedAt: moment(dataset.updated_at).fromNow(),
    parsedDescription: _parsedDescription(dataset.description),
    rowsCounted: 0, // TODO dataset.service.rows_counted,
    rowsCountedParsed: [],// TODO _parsedRowsCounted(dataset.service.rows_counted)
    geometryTypeClass: 'class', // TODO _getGeometryTypes(dataset.table.geometry_types)
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

var _getGeometryTypes = function (geometryTypes) {
  var DATASET_CLASS = 'Dataset';

  return geometryTypes
    ? geometryTypes[0] + DATASET_CLASS
    : DATASET_CLASS
}

var _nameOrUsername = function (user) {
  return user.name && user.last_name.present
    ? user.name + ' ' + user.last_name
    : user.username
}
