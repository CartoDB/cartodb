var cdb = require('cartodb-deep-insights.js');
var $ = require('jquery');
var DatasetItem = require('./dataset-item-view');
var moment = require('moment');
var markdown = require('markdown');
var Utils = require('../../../../../helpers/utils');
var TipsyTooltipView = require('../../../../tipsy-tooltip-view');
var UploadConfig = require('../../../../../config/upload-config');
var template = require('./remote-dataset-item.tpl');

/**
 *  Remote dataset item view
 *
 */

module.exports = DatasetItem.extend({
  tagName: 'li',
  className: 'ModalBlockList-item ModalBlockList-item--full',

  events: {
    'click .js-tag-link': '_onTagClick',
    'click': '_toggleSelected'
  },

  render: function () {
    var tableModel = this.model.getTableModel();
    var tags = this.model.get('tags') || [];
    var description = cdb.core.sanitize.html(this.model.get('description') || '');
    var source = markdown.toHTML(this.model.get('source') || '');
    var tableGeomColumnTypes = tableModel.getGeometryType() || [];

    var d = {
      isRaster: this.model.isRaster(),
      geometryType: tableGeomColumnTypes.length > 0 ? tableGeomColumnTypes[0] : '',
      title: this.model.get('display_name') || this.model.get('name'),
      source: source,
      description: description,
      timeDiff: moment(this.model.get('updated_at')).fromNow(),
      tags: tags,
      tagsCount: tags.length,
      routerModel: this._routerModel,
      maxTagsToShow: 3,
      canImportDataset: this._canImportDataset(),
      rowCount: undefined,
      datasetSize: undefined
    };

    var rowCount = tableModel.get('row_count');
    if (rowCount >= 0) {
      d.rowCount = rowCount;
      d.rowCountFormatted = (rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount));
    }

    var datasetSize = tableModel.get('size');
    if (datasetSize >= 0) {
      d.datasetSize = Utils.readablizeBytes(
        datasetSize,
        datasetSize.toString().length > 9
      );
    }

    this.$el.html(template(d));
    this._setItemClasses();
    this._renderTooltips();

    return this;
  },

  _setItemClasses: function () {
    // Item selected?
    this.$el.toggleClass('is-selected', !!this.model.get('selected'));
    // Check if it is selectable
    this.$el.toggleClass('DatasetsList-item--selectable', !!this._canImportDataset());
    // Check if it is importable
    this.$el.toggleClass('DatasetsList-item--banned', !this._canImportDataset());
  },

  _renderTooltips: function () {
    this.addView(
      new TipsyTooltipView({
        el: this.$('.DatasetsList-itemStatus'),
        title: function (e) {
          return $(this).attr('data-title');
        }
      })
    );
  },

  _onTagClick: function (ev) {
    if (ev) {
      this.killEvent(ev);
    }

    var tag = $(ev.target).val();

    if (tag) {
      this._routerModel.set({
        tag: tag,
        library: true
      });
    }
  },

  _canImportDataset: function () {
    var tableModel = this.model.getTableModel();
    var tableSize = tableModel.get('size') || 0;
    return (
      this._userModel.get('remaining_byte_quota') * UploadConfig.fileTimesBigger >= tableSize &&
      this._userModel.get('limits')['import_file_size'] > tableSize
    );
  },

  _toggleSelected: function (ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      if (this._canImportDataset() && this._createModel.canSelect(this.model)) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }

});
