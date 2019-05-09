const $ = require('jquery');
const moment = require('moment');
const CoreView = require('backbone/core-view');
const pluralizeString = require('dashboard/helpers/pluralize');
const loadingView = require('builder/components/loading/render-loading');
const failTemplate = require('dashboard/components/fail.tpl');
const template = require('./delete-items.tpl');
const VisualizationModel = require('dashboard/data/visualization-model');
const MapCardPreview = require('dashboard/components/mapcard-preview-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const AFFECTED_ENTITIES_SAMPLE_COUNT = 3;

const REQUIRED_OPTS = [
  'viewModel',
  'userModel',
  'configModel',
  'modalModel'
];

/**
 * Delete items dialog
 */
module.exports = CoreView.extend({
  events: {
    'click .ok': 'ok',
    'click .cancel': 'close'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._viewModel.loadPrerequisites();
    this.listenTo(this._viewModel, 'change', function () {
      if (this._viewModel.state() === 'DeleteItemsDone') {
        this.close();
      } else {
        this.render();
      }
    });
    this.add_related_model(this._viewModel);
  },

  render: function () {
    this.$el.html(this.render_content());
    this._loadMapPreviews();
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function () {
    return this['_render' + this._viewModel.state()]();
  },

  _renderLoadingPrerequisites: function () {
    return loadingView({
      title: `Checking what consequences deleting the selected ${this._pluralizedContentType()} would have...`
    });
  },

  _renderLoadPrerequisitesFail: function () {
    return failTemplate({
      msg: 'Failed to check consequences of deleting the selected ' + this._pluralizedContentType()
    });
  },

  _renderConfirmDeletion: function () {
    // An entity can be an User or Organization
    const affectedEntities = this._viewModel.affectedEntities();
    const affectedVisData = this._viewModel.affectedVisData();

    return template({
      firstItemName: this._getFirstItemName(),
      selectedCount: this._viewModel.length,
      isDatasets: this._viewModel.isDeletingDatasets(),
      pluralizedContentType: this._pluralizedContentType(),
      affectedEntitiesCount: affectedEntities.length,
      affectedEntitiesSample: affectedEntities.slice(0, AFFECTED_ENTITIES_SAMPLE_COUNT),
      affectedEntitiesSampleCount: AFFECTED_ENTITIES_SAMPLE_COUNT,
      affectedVisCount: affectedVisData.length,
      pluralizedMaps: pluralizeString('map', affectedVisData.length),
      affectedVisVisibleCount: affectedVisData.length,
      visibleAffectedVis: this._prepareVisibleAffectedVisForTemplate(affectedVisData)
    });
  },

  _prepareVisibleAffectedVisForTemplate: function (visibleAffectedVisData) {
    return visibleAffectedVisData.map(function (visData) {
      const vis = new VisualizationModel(visData, { configModel: this._configModel });
      const owner = vis.permission.owner;

      return {
        visId: vis.get('id'),
        name: vis.get('name'),
        url: vis.viewUrl(this._userModel).edit(),
        owner: owner,
        ownerName: owner.get('username'),
        isOwner: vis.permission.isOwner(this._userModel),
        showPermissionIndicator: !vis.permission.hasWriteAccess(this._userModel),
        timeDiff: moment(vis.get('updated_at')).fromNow(),
        authTokens: vis.get('auth_tokens').join(';')
      };
    }, this);
  },

  /**
   * @overrides BaseDialog.prototype.ok
   */
  ok: function () {
    this._viewModel.deleteItems();
    this.render();
  },

  close: function () {
    this._modalModel.destroy();
  },

  _loadMapPreviews: function () {
    const currentView = this;

    this.$el.find('.MapCard').each(function () {
      var username = $(this).data('visOwnerName');
      var mapCardPreview = new MapCardPreview({
        config: currentView._configModel,
        el: $(this).find('.js-header'),
        width: 298,
        height: 130,
        mapsApiResource: currentView._configModel.getMapsResourceName(username),
        visId: $(this).data('visId'),
        username: username,
        authTokens: $(this).data('visAuthTokens').split(';')
      }).load();

      currentView.addView(mapCardPreview);
    });
  },

  _renderDeletingItems: function () {
    return loadingView({
      title: `Deleting the selected ${this._pluralizedContentType()}...`
    });
  },

  _renderDeleteItemsFail: function () {
    let message = this._viewModel.errorMessage().replace(/\n/g, '<br>');

    if (message === 'something failed') {
      message = '';
    }
    return failTemplate({
      msg: `Failed to delete the selected ${this._pluralizedContentType()}. ${message}`
    });
  },

  _pluralizedContentType: function () {
    return pluralizeString(
      this._viewModel.isDeletingDatasets() ? 'dataset' : 'map',
      this._viewModel.length
    );
  },

  _getFirstItemName: function () {
    if (!this.options.viewModel) return;

    var firstItem = this.options.viewModel.at(0);

    if (firstItem) {
      return firstItem.get('name');
    }
  }

});
