var cdb = require('cartodb.js');
// var moment = require('moment');
var Utils = require('cdb.Utils');
// var navigateThroughRouter = require('../../common/view_helpers/navigate_through_router');
// var pluralizeString = require('../../common/view_helpers/pluralize_string');
// var LikesView = require('../../common/views/likes/view');
// var EditableDescription = require('../../dashboard/editable_fields/editable_description');
// var EditableTags = require('../../dashboard/editable_fields/editable_tags');
// var SyncView = require('../../common/dialogs/sync_dataset/sync_dataset_view');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'MapsList-item',

  initialize: function() {
    this.template = cdb.templates.getTemplate('data_library/dataset_item_template');
  },

  render: function() {
    this.clearSubViews();

    var vis = this.model;

    var d = {
      vis: vis.attributes,
      date: this.model.get('order') === 'updated_at' ? vis.get('updated_at') : vis.get('created_at'),
      datasetSize: this._getDatasetSize(vis.get('table')['size']),
      geomType: this._getGeometryType(vis.get('table')['geometry_types']),
      account_host: cdb.config.get('account_host')
    };

    this.$el.html(this.template(d));

    return this;
  },

  _getGeometryType: function(geomTypes) {
    if (geomTypes && geomTypes.length > 0) {
      var types = ['point', 'polygon', 'line', 'raster'];
      var geomType = geomTypes[0];

      return _.find(types, function(type) {
        return geomType.toLowerCase().indexOf(type) !== -1;
      });

    } else {
      return null;
    }
  },

  _getDatasetSize: function(size) {
    return size ? cdb.Utils.readablizeBytes(size, true).split(' ') : 0;
  },

});
