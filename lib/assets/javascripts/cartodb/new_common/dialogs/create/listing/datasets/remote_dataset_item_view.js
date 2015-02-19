var cdb = require('cartodb.js');
var DatasetItem = require('./dataset_item_view');
var navigateThroughRouter = require('new_common/view_helpers/navigate_through_router');
var Utils = require('cdb.Utils');
var pluralizeString = require('new_common/view_helpers/pluralize_string');

/**
 *  Remote dataset item view
 *
 */

module.exports = DatasetItem.extend({

  tagName: 'li',
  className: 'DatasetsList-item DatasetsList-item--selectable',

  events: {
    'click .js-tag-link': '_onTagClick',
    'click': '_selectDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.routerModel = this.options.routerModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/remote_dataset_item');
    this.table = new cdb.admin.CartoDBTableMetadata(this.model.get('external_source'));

    this._initBinds();
  },

  render: function() {
    var vis = this.model;
    var user = this.user;
    var table = this.table;
    var tags = vis.get('tags') || [];
    var description = vis.get('description') && Utils.stripHTML(markdown.toHTML(vis.get('description'))) || '';
    var source = vis.get('source') && markdown.toHTML(vis.get('source')) || '';

    var d = {
      isRaster:                vis.get('kind') === 'raster',
      geometryType:            table.geomColumnTypes().length > 0 ? table.geomColumnTypes()[0] : '',
      title:                   vis.get('name'),
      source:                  source,
      description:             description,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
      routerModel:             this.routerModel,
      maxTagsToShow:           3,
      rowCount:                undefined,
      datasetSize:             undefined
    };

    var rowCount = table.get('row_count');
    if (rowCount >= 0) {
      d.rowCount = ( rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount) );
      d.pluralizedRows = pluralizeString('Row', rowCount);
    }

    var datasetSize = table.get('size');
    if (datasetSize >= 0) {
      d.datasetSize = Utils.readablizeBytes(datasetSize, true);
    }

    this.$el.html(this.template(d));

    return this;
  },

  _onTagClick: function(ev) {
    if (ev) {
      this.killEvent(ev);
    }
    
    var tag = $(ev.target).val();

    if (tag) {
      this.routerModel.set({
        tag: tag,
        library: true
      });
    }
  },

  _selectDataset: function(ev) {
    if (ev.target.tagName !== 'A') {
      var d = {
        type: 'remote',
        value: this.model.get('name'),
        remote_visualization_id: this.model.get('id'),
        size: this.table.get('size')
      }

      this.trigger('remoteSelected', d, this);
    }
  }

});
