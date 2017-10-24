var cdb = require('cartodb.js-v3');
var moment = require('moment-v3');
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
    'click': '_toggleSelected'
  },

  initialize: function() {
    this.user = this.options.user;
    this.routerModel = this.options.createModel.visFetchModel;
    this.template = cdb.templates.getTemplate('common/views/create/listing/dataset_item');
    this.table = new cdb.admin.CartoDBTableMetadata(this.model.get('table'));

    this.model.on('change', this.render, this);
  },

  render: function() {
    var vis = this.model;
    var table = this.table;
    var tags = vis.get('tags') || [];
    var description = vis.get('description') && Utils.stripHTML(markdown.toHTML(vis.get('description'))) || '';

    var d = {
      isRaster:                vis.get('kind') === 'raster',
      geometryType:            table.geomColumnTypes().length > 0 ? table.geomColumnTypes()[0] : '',
      title:                   vis.get('name'),
      isOwner:                 vis.permission.isOwner(this.user),
      owner:                   vis.permission.owner.renderData(this.user),
      showPermissionIndicator: !vis.permission.hasWriteAccess(this.user),
      description:             description,
      privacy:                 vis.get('privacy').toLowerCase(),
      likes:                   vis.get('likes') || 0,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
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

  _renderLikesIndicator: function() {
    var view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderTooltips: function() {
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

  _toggleSelected: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      if (this.options.createModel.canSelect(this.model)) {
        this.model.set('selected', !this.model.get('selected'));
      }
    }
  }
});
