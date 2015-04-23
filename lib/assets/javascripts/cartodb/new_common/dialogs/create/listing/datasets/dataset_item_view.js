var cdb = require('cartodb.js');
var moment = require('moment');
var Utils = require('cdb.Utils');
var pluralizeString = require('../../../../view_helpers/pluralize_string');
var LikesView = require('../../../../views/likes/view');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'DatasetsList-item DatasetsList-item--selectable',

  events: {
    'click .js-tag-link': '_onTagClick',
    'click': '_selectDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.routerModel = this.options.routerModel;
    this.template = cdb.templates.getTemplate('new_common/views/create/listing/dataset_item');
    this.table = new cdb.admin.CartoDBTableMetadata(this.model.get('table'));

    this._initBinds();
  },

  render: function() {
    var vis = this.model;
    var user = this.user;
    var table = this.table;
    var isOwner = vis.permission.isOwner(user);
    var tags = vis.get('tags') || [];
    var description = vis.get('description') && Utils.stripHTML(markdown.toHTML(vis.get('description'))) || '';

    var d = {
      isRaster:                vis.get('kind') === 'raster',
      geometryType:            table.geomColumnTypes().length > 0 ? table.geomColumnTypes()[0] : '',
      title:                   vis.get('name'),
      isOwner:                 isOwner,
      owner:                   vis.permission.owner.renderData(this.user),
      showPermissionIndicator: !isOwner && vis.permission.getPermission(user) === cdb.admin.Permission.READ_ONLY,
      description:             description,
      privacy:                 vis.get('privacy').toLowerCase(),
      likes:                   vis.get('likes') || 0,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
      routerModel:             this.routerModel,
      maxTagsToShow:           3,
      rowCount:                undefined,
      datasetSize:             undefined,
      syncStatus:              undefined,
      syncRanAt:               undefined
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

    if (!_.isEmpty(vis.get("synchronization"))) {
      d.syncRanAt = moment(vis.get("synchronization").ran_at || new Date()).fromNow();
      d.syncStatus = vis.get("synchronization").state;
    }

    this.$el.html(this.template(d));

    this._renderLikesIndicator();
    this._renderTooltips();

    // Item selected?
    this.$el[ vis.get('selected') ? 'addClass' : 'removeClass' ]('is--selected');

    return this;
  },

  _initBinds: function() {
    this.model.on('change', this.render, this);
  },

  _renderLikesIndicator: function() {
    var view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderTooltips: function() {
    // Tooltip
    if (!_.isEmpty(this.model.get("synchronization"))) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.DatasetsList-itemStatus'),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }
  },

  _onTagClick: function(ev) {
    var tag = $(ev.target).val();

    if (tag) {
      this.routerModel.set('tag', tag);
    }
  },

  _selectDataset: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      this.trigger('itemSelected', this.model, this);
    }
  }
});
