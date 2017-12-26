var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var DatasetItem = require('./dataset_item_view');
var Utils = require('cdb.Utils');
var UploadConfig = require('../../../../background_polling/models/upload_config');
var pluralizeString = require('../../../../view_helpers/pluralize_string');

/**
 *  Remote dataset item view
 *
 */

module.exports = DatasetItem.extend({

  tagName: 'li',
  className: 'DatasetsList-item',

  events: {
    'click .js-tag-link': '_onTagClick',
    'click': '_toggleSelected'
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('common/views/create/listing/remote_dataset_item');
    this.table = new cdb.admin.CartoDBTableMetadata(this.model.get('external_source'));
  },

  render: function() {
    var vis = this.model;
    var table = this.table;
    var tags = vis.get('tags') || [];
    var description = vis.get('description') && Utils.stripHTML(markdown.toHTML(vis.get('description'))) || '';
    var source = vis.get('source') && markdown.toHTML(vis.get('source')) || '';

    var d = {
      isRaster:                vis.get('kind') === 'raster',
      geometryType:            table.geomColumnTypes().length > 0 ? table.geomColumnTypes()[0] : '',
      title:                   vis.get('display_name') || vis.get('name'),
      source:                  source,
      description:             description,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
      routerModel:             this.routerModel,
      maxTagsToShow:           3,
      canImportDataset:        this._canImportDataset(),
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
      d.datasetSize = Utils.readablizeBytes(
        datasetSize,
        datasetSize.toString().length > 9 ? false : true
      );
    }

    this.$el.html(this.template(d));
    this._setItemClasses();
    this._renderTooltips();

    return this;
  },

  _setItemClasses: function() {
    // Item selected?
    this.$el[ this.model.get('selected') ? 'addClass' : 'removeClass' ]('is--selected');
    // Check if it is selectable
    this.$el[ this._canImportDataset() ? 'addClass' : 'removeClass' ]('DatasetsList-item--selectable');
    // Check if it is importable
    this.$el[ this._canImportDataset() ? 'removeClass' : 'addClass' ]('DatasetsList-item--banned');
  },

  _renderTooltips: function() {
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.DatasetsList-itemStatus'),
        title: function(e) {
          return $(this).attr('data-title')
        }
      })
    )
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

  _canImportDataset: function() {
    var table_size = this.table.get('size') || 0;
    return (
        this.user.get('remaining_byte_quota') * UploadConfig.fileTimesBigger >= table_size &&
        this.user.get('limits')['import_file_size'] > table_size
      );
  },

  _toggleSelected: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      if (this._canImportDataset() && this.options.createModel.canSelect(this.model)) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }

});
