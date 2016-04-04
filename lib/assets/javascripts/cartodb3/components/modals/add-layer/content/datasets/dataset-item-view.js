var cdb = require('cartodb-deep-insights.js');
var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var Utils = require('../../../../../helpers/utils');
var TipsyTooltipView = require('../../../../tipsy-tooltip-view');
var template = require('./dataset-item.tpl');
var LikesView = require('../../../../likes/likes-view');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({
  tagName: 'li',
  className: 'DatasetsList-item DatasetsList-item--selectable',

  events: {
    'click .js-tag-link': '_onTagClick',
    'click': '_toggleSelected'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._routerModel = this._createModel.getVisualizationFetchModel();

    this.model.on('change', this.render, this);
  },

  render: function () {
    var tableModel = this.model.getTableModel();
    var permissionModel = this.model.getPermissionModel();
    var synchronizationModel = this.model.getSynchronizationModel();
    var tags = this.model.get('tags') || [];
    var description = cdb.core.sanitize.html(this.model.get('description'));
    var tableGeomColumnTypes = tableModel.getGeometryType() || [];

    var d = {
      isRaster: this.model.isRaster(),
      geometryType: tableGeomColumnTypes.length > 0 ? tableGeomColumnTypes[0] : '',
      title: this.model.get('name'),
      isOwner: permissionModel.isOwner(this._userModel),
      owner: permissionModel.getOwner().renderData(this._userModel),
      showPermissionIndicator: !permissionModel.hasWriteAccess(this._userModel),
      description: description,
      privacy: this.model.get('privacy').toLowerCase(),
      likes: this.model.get('likes') || 0,
      timeDiff: moment(this.model.get('updated_at')).fromNow(),
      tags: tags,
      tagsCount: tags.length,
      maxTagsToShow: 3,
      rowCount: undefined,
      datasetSize: undefined,
      syncStatus: undefined,
      syncRanAt: undefined
    };

    var rowCount = tableModel.get('row_count');
    if (rowCount >= 0) {
      d.rowCount = rowCount;
      d.rowCountFormatted = (rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount));
    }

    var datasetSize = tableModel.get('size');
    if (datasetSize >= 0) {
      d.datasetSize = Utils.readablizeBytes(datasetSize, true);
    }

    if (!_.isEmpty(synchronizationModel)) {
      d.syncRanAt = moment(synchronizationModel.get('ran_at') || new Date()).fromNow();
      d.syncStatus = synchronizationModel.get('state');
    }

    this.$el.html(template(d));

    this._renderLikesIndicator();
    this._renderTooltips();

    // Item selected?
    this.$el.toggleClass('is--selected', !!this.model.get('selected'));

    return this;
  },

  _renderLikesIndicator: function () {
    var view = new LikesView({
      model: this.model.getLikesModel()
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderTooltips: function () {
    if (!_.isEmpty(this.model.get('synchronization'))) {
      this.addView(
        new TipsyTooltipView({
          el: this.$('.DatasetsList-itemStatus'),
          title: function (e) {
            return $(this).attr('data-title');
          }
        })
      );
    }
  },

  _onTagClick: function (ev) {
    var tag = $(ev.target).val();

    if (tag) {
      this._routerModel.set('tag', tag);
    }
  },

  _toggleSelected: function (ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      if (this._createModel.canSelect(this.model)) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }
});
