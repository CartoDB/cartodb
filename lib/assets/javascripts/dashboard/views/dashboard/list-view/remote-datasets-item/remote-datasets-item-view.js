const _ = require('underscore');
const $ = require('jquery');
const DatasetsItem = require('dashboard/views/dashboard/list-view/datasets-item/datasets-item-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const markdown = require('markdown');
const moment = require('moment');
const CartoDBTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const UploadConfig = require('builder/config/upload-config');
const Utils = require('builder/helpers/utils');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const template = require('./remote-datasets-item.tpl');

/**
 *  Remote dataset item view
 *
 */

module.exports = DatasetsItem.extend({

  tagName: 'li',
  className: 'DatasetsList-item',

  events: {
    'click .js-tag-link': navigateThroughRouter,
    'click': '_selectDataset'
  },

  initialize: function () {
    this.user = this.options.userModel;
    this.router = this.options.routerModel;
    this.table = new CartoDBTableMetadata(this.model.get('external_source'), {
      configModel: this.options.configModel
    });

    this._initBinds();
  },

  render: function () {
    var vis = this.model;
    var table = this.table;
    var tags = vis.get('tags') || [];
    var description = vis.get('description') && Utils.stripHTML(markdown.toHTML(vis.get('description'))) || '';
    var source = vis.get('source') && markdown.toHTML(vis.get('source')) || '';

    var d = {
      isRaster: vis.get('kind') === 'raster',
      geometryType: table.statsGeomColumnTypes().length > 0 ? table.statsGeomColumnTypes()[0] : '',
      title: vis.get('display_name') || vis.get('name'),
      source: source,
      description: description,
      timeDiff: moment(vis.get('updated_at')).fromNow(),
      tags: tags,
      tagsCount: tags.length,
      router: this.router,
      maxTagsToShow: 3,
      canImportDataset: this._canImportDataset(),
      rowCount: undefined,
      datasetSize: undefined,
      fromExternalSource: ''
    };

    var rowCount = table.get('row_count');
    if (rowCount >= 0) {
      d.rowCount = (rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount));
      d.pluralizedRows = pluralizeString('Row', rowCount);
    }

    if (!_.isEmpty(vis.get('synchronization'))) {
      d.fromExternalSource = vis.get('synchronization').from_external_source;
    }

    var datasetSize = table.get('size');
    if (datasetSize >= 0) {
      d.datasetSize = Utils.readablizeBytes(
        datasetSize,
        !(datasetSize.toString().length > 9)
      );
    }

    this.$el.html(template(d));
    this._setItemClasses();
    this._renderTooltips();

    return this;
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

  _setItemClasses: function () {
    // Item selected?
    this.$el[ this.model.get('selected') ? 'addClass' : 'removeClass' ]('is--selected');
    // Check if it is selectable
    this.$el[ this._canImportDataset() ? 'addClass' : 'removeClass' ]('DatasetsList-item--selectable');
    // Check if it is importable
    this.$el[ this._canImportDataset() ? 'removeClass' : 'addClass' ]('DatasetsList-item--banned');
  },

  _canImportDataset: function () {
    var table_size = this.table.get('size') || 0;
    return (
      this.user.get('remaining_byte_quota') * UploadConfig.fileTimesBigger >= table_size &&
        this.user.get('limits')['import_file_size'] > table_size
    );
  },

  _selectDataset: function (ev) {
    if (ev.target.tagName !== 'A') {
      // If it fits on user quota, user can select it
      if (this._canImportDataset()) {
        this.killEvent(ev);
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }

});
