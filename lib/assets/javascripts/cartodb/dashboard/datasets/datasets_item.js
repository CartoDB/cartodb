var cdb = require('cartodb.js-v3');
var moment = require('moment-v3');
var Utils = require('cdb.Utils');
var navigateThroughRouter = require('../../common/view_helpers/navigate_through_router');
var pluralizeString = require('../../common/view_helpers/pluralize_string');
var LikesView = require('../../common/views/likes/view');
var EditableDescription = require('../../dashboard/editable_fields/editable_description');
var EditableTags = require('../../dashboard/editable_fields/editable_tags');
var SyncView = require('../../common/dialogs/sync_dataset/sync_dataset_view');

/**
 * View representing an item in the list under datasets route.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'DatasetsList-item DatasetsList-item--selectable',

  events: {
    'click .js-tag-link': navigateThroughRouter,
    'click .js-privacy': '_openPrivacyDialog',
    'click .js-sync': '_openSyncDialog',
    'click': '_selectDataset'
  },

  initialize: function() {
    this.user = this.options.user;
    this.router = this.options.router;
    this.template = cdb.templates.getTemplate('dashboard/views/datasets_item');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var vis = this.model;
    var table = vis.tableMetadata();
    var tags = vis.get('tags') || [];

    var url = vis.viewUrl(this.user);
    url = (this.router.model.get('liked') && !vis.permission.hasAccess(this.user)) ? url.public() : url.edit();

    var d = {
      isRaster:                vis.get('kind') === 'raster',
      geometryType:            table.statsGeomColumnTypes().length > 0 ? table.statsGeomColumnTypes()[0] : '',
      title:                   vis.get('name'),
      datasetUrl:              encodeURI(url),
      isOwner:                 vis.permission.isOwner(this.user),
      owner:                   vis.permission.owner.renderData(this.user),
      showPermissionIndicator: !vis.permission.hasWriteAccess(this.user),
      privacy:                 vis.get('privacy').toLowerCase(),
      likes:                   vis.get('likes') || 0,
      timeDiff:                moment(vis.get('updated_at')).fromNow(),
      tags:                    tags,
      tagsCount:               tags.length,
      router:                  this.router,
      maxTagsToShow:           3,
      rowCount:                undefined,
      datasetSize:             undefined,
      syncStatus:              undefined,
      syncRanAt:               undefined,
      fromExternalSource:      ""
    };

    var rowCount = table.get('row_count');
    if (rowCount >= 0) {
      d.rowCount = ( rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount) );
      d.pluralizedRows = pluralizeString('Row', rowCount);
    }

    if (!_.isEmpty(vis.get("synchronization"))) {
      d.fromExternalSource = vis.get("synchronization").from_external_source;
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

    this._renderDescription();
    this._renderTags();
    this._renderLikesIndicator();
    this._renderTooltips();

    // Item selected?
    this.$el[ vis.get('selected') ? 'addClass' : 'removeClass' ]('is--selected');

    return this;
  },

  _initBinds: function() {
    this.model.on('change', this.render, this);
  },

  _renderDescription: function() {
    var isOwner = this.model.permission.isOwner(this.user);
    var view = new EditableDescription({
      el: this.$('.js-item-description'),
      model: this.model,
      editable: isOwner && this.user.hasCreateDatasetsFeature()
    });
    this.addView(view.render());
  },

  _renderTags: function() {
    var isOwner = this.model.permission.isOwner(this.user);
    var view = new EditableTags({
      el: this.$('.js-item-tags'),
      model: this.model,
      router: this.router,
      editable: isOwner && this.user.hasCreateDatasetsFeature()
    });
    this.addView(view.render());
  },

  _renderLikesIndicator: function() {
    var view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderTooltips: function() {
    var synchronization = this.model.get("synchronization");

    if (!_.isEmpty(synchronization)) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.js-syncInfo'),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }

    if (!this.model.permission.isOwner(this.user)) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.UserAvatar'),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }

    if (!_.isEmpty(synchronization) && synchronization.from_external_source) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$('.js-public'),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    }
  },

  _openPrivacyDialog: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('openPrivacyDialog', this.model);
  },

  _openSyncDialog: function(ev) {
    this.killEvent(ev);
    var view = new SyncView({
      clean_on_hide: true,
      enter_to_confirm: true,
      table: this.model.tableMetadata()
    });

    // Force render of this item after changing sync settings
    var self = this;
    var originalOK = view.ok;
    view.ok = function() {
      originalOK.apply(view, arguments);
      self.model.fetch(); // to force a re-render due to possible changed sync settings
    };

    view.appendToBody();
  },

  _selectDataset: function(ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      this.model.set('selected', !this.model.get('selected'));
    }
  }
});
