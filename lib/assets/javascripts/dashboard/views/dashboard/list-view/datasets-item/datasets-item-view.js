const _ = require('underscore');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const navigateThroughRouter = require('builder/helpers/navigate-through-router');
const pluralizeString = require('dashboard/helpers/pluralize');
const LikesView = require('dashboard/components/likes/like-view');
const EditableDescription = require('dashboard/components/editable-fields/editable-description');
const EditableTags = require('dashboard/components/editable-fields/editable-tags');
const SyncView = require('dashboard/views/dashboard/sync-dataset/sync-dataset-view.js');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
const ChangePrivacyView = require('dashboard/views/dashboard/dialogs/change-privacy/change-privacy-view');
const Utils = require('builder/helpers/utils');
const template = require('./datasets-item.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'routerModel',
  'modals'
];

/**
 * View representing an item in the list under datasets route.
 */
module.exports = CoreView.extend({
  tagName: 'li',
  className: 'DatasetsList-item DatasetsList-item--selectable',

  events: {
    'click .js-tag-link': navigateThroughRouter,
    'click .js-privacy': '_openPrivacyDialog',
    'click .js-sync': '_openSyncDialog',
    'click': '_selectDataset'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    const vis = this.model;
    const table = vis.tableMetadata();
    const tags = vis.get('tags') || [];

    let url = vis.viewUrl(this._userModel);
    url = (this._routerModel.model.get('liked') && !vis.permission.hasAccess(this._userModel)) ? url.public() : url.edit();

    const templateData = {
      isRaster: vis.get('kind') === 'raster',
      geometryType: table.statsGeomColumnTypes().length > 0 ? table.statsGeomColumnTypes()[0] : '',
      title: vis.get('name'),
      datasetUrl: encodeURI(url),
      isOwner: vis.permission.isOwner(this._userModel),
      owner: vis.permission.owner.renderData(this._userModel),
      showPermissionIndicator: !vis.permission.hasWriteAccess(this._userModel),
      privacy: vis.get('privacy').toLowerCase(),
      likes: vis.get('likes') || 0,
      timeDiff: moment(vis.get('updated_at')).fromNow(),
      tags,
      tagsCount: tags.length,
      router: this._routerModel,
      maxTagsToShow: 3,
      rowCount: undefined,
      datasetSize: undefined,
      syncStatus: undefined,
      syncRanAt: undefined,
      fromExternalSource: ''
    };

    const rowCount = table.get('row_count');
    if (rowCount >= 0) {
      templateData.rowCount = rowCount < 10000 ? Utils.formatNumber(rowCount) : Utils.readizableNumber(rowCount);
      templateData.pluralizedRows = pluralizeString('Row', rowCount);
    }

    if (!_.isEmpty(vis.get('synchronization'))) {
      templateData.fromExternalSource = vis.get('synchronization').from_external_source;
    }

    const datasetSize = table.get('size');
    if (datasetSize >= 0) {
      templateData.datasetSize = Utils.readablizeBytes(datasetSize, true);
    }

    if (!_.isEmpty(vis.get('synchronization'))) {
      templateData.syncRanAt = moment(vis.get('synchronization').ran_at || new Date()).fromNow();
      templateData.syncStatus = vis.get('synchronization').state;
    }

    this.$el.html(template(templateData));

    this._renderDescription();
    this._renderTags();
    this._renderLikesIndicator();
    this._renderTooltips();

    // Item selected?
    this.$el[ vis.get('selected') ? 'addClass' : 'removeClass' ]('is--selected');

    return this;
  },

  _initBinds: function () {
    this.model.on('change', this.render, this);
  },

  _renderDescription: function () {
    const isOwner = this.model.permission.isOwner(this._userModel);
    const view = new EditableDescription({
      el: this.$('.js-item-description'),
      model: this.model,
      editable: isOwner && this._userModel.hasCreateDatasetsFeature()
    });
    this.addView(view.render());
  },

  _renderTags: function () {
    const isOwner = this.model.permission.isOwner(this._userModel);
    const view = new EditableTags({
      el: this.$('.js-item-tags'),
      model: this.model,
      routerModel: this._routerModel,
      editable: isOwner && this._userModel.hasCreateDatasetsFeature()
    });
    this.addView(view.render());
  },

  _renderLikesIndicator: function () {
    const view = new LikesView({
      model: this.model.like
    });
    this.$('.js-likes-indicator').replaceWith(view.render().el);
    this.addView(view);
  },

  _renderTooltips: function () {
    const synchronization = this.model.get('synchronization');

    if (!_.isEmpty(synchronization)) {
      this.addView(
        new TipsyTooltipView({
          el: this.$('.js-syncInfo')
        })
      );
    }

    if (!this.model.permission.isOwner(this._userModel)) {
      this.addView(
        new TipsyTooltipView({
          el: this.$('.UserAvatar')
        })
      );
    }

    if (!_.isEmpty(synchronization) && synchronization.from_external_source) {
      this.addView(
        new TipsyTooltipView({
          el: this.$('.js-public')
        })
      );
    }
  },

  _openPrivacyDialog: function (ev) {
    this.killEvent(ev);

    this._modals.create(modalModel => {
      return new ChangePrivacyView({
        visModel: this.model,
        userModel: this._userModel,
        configModel: this._configModel,
        modals: this._modals,
        modalModel
      });
    });
  },

  _openSyncDialog: function (ev) {
    this.killEvent(ev);

    this._modals.create(modalModel => {
      const view = new SyncView({
        enter_to_confirm: true,
        table: this.model.tableMetadata(),
        modalModel
      });

      // Force render of this item after changing sync settings
      const originalOK = view.ok;
      view.ok = () => {
        originalOK.apply(view, arguments);
        this.model.fetch(); // to force a re-render due to possible changed sync settings
      };

      return view;
    });
  },

  _selectDataset: function (ev) {
    // Let links use default behaviour
    if (ev.target.tagName !== 'A') {
      this.killEvent(ev);
      this.model.set('selected', !this.model.get('selected'));
    }
  }
});
