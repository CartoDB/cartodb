var cdb = require('cartodb.js');
var moment = require('moment');
var Utils = require('cdb.Utils');
var handleAHref = require('new_common/view_helpers/handle_a_href_on_click');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var LikesView = require('new_common/views/likes/view');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'DatasetsList-item',

  events: {
    'click .js-tag-link': handleAHref,
    'click': '_selectDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.template = cdb.templates.getTemplate('new_dashboard/views/datasets_item');
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
      datasetUrl:              this._datasetUrl(),
      isOwner:                 isOwner,
      owner:                   vis.permission.owner.renderData(this.user),
      showPermissionIndicator: !isOwner && vis.permission.getPermission(user) === cdb.admin.Permission.READ_ONLY,
      description:             description,
      privacy:                 vis.get('privacy').toLowerCase(),
      likes:                   vis.get('likes') || 0,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
      routerModel:             this.router.model,
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

    this._renderLikesIndicator();

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

  _datasetUrl: function() {
    // TODO: Points to old dashboard URL, needs to be updated
    return cdb.config.prefixUrl() +'/tables/'+ this.model.get('name')
  },

  _selectDataset: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      this.model.set('selected', !this.model.get('selected'));
    }
  }
});
