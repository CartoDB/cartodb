var _ = require('underscore');
var moment = require('moment');
var ConfirmationView = require('../confirmation/modal-confirmation-view');
var VisDefinitionModel = require('../../../data/vis-definition-model');
var MapcardPreview = require('../../../helpers/mapcard-preview');
var ErrorView = require('../../error/error-view');
var renderLoading = require('../../loading/render-loading');
var tableDeleteOperation = require('../../../dataset/operations/table-delete-operation');
var template = require('./remove-dataset.tpl');
var errorParser = require('../../../helpers/error-parser');
var REQUIRED_OPTS = [
  'modalModel',
  'userModel',
  'visModel',
  'tableModel',
  'configModel'
];
var AFFECTED_VIS_COUNT = 3;
var AFFECTED_ENTITIES_SAMPLE_COUNT = 20;

/**
 *  Remove dataset modal dialog
 */
module.exports = ConfirmationView.extend({
  className: 'Dialog-content',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._acl = this._visModel._permissionModel.acl;
  },

  render: function () {
    var affectedVisData = this._tableModel.get('accessible_dependent_derived_maps');
    var affectedEntitiesData = this._prepareVisibleAffectedEntities();

    this.clearSubViews();

    this.$el.html(
      template({
        modalModel: this._modalModel,
        tableName: this._tableModel.getUnquotedName(),
        affectedVisCount: affectedVisData.length,
        visibleAffectedVis: this._prepareVisibleAffectedVis(affectedVisData.slice(0, AFFECTED_VIS_COUNT)),
        affectedEntitiesCount: affectedEntitiesData.length,
        visibleAffectedEntities: affectedEntitiesData.slice(0, AFFECTED_ENTITIES_SAMPLE_COUNT)
      })
    );
    return this;
  },

  _prepareVisibleAffectedVis: function (visibleAffectedVisData) {
    return visibleAffectedVisData.map(function (visData) {
      var vis = new VisDefinitionModel(visData, {
        configModel: this._configModel
      });
      var owner = vis._permissionModel.get('owner');

      return {
        visId: vis.get('id'),
        name: vis.get('name'),
        url: vis.builderURL(),
        ownerName: owner.username,
        timeDiff: moment(vis.get('updated_at')).fromNow(),
        previewUrl: MapcardPreview.urlForStaticMap(this._configModel.get('maps_api_template'), vis, 304, 96)
      };
    }, this);
  },

  _prepareVisibleAffectedEntities: function () {
    var types = this._acl.pluck('type');
    if (types.indexOf('org') > -1) {
      return this._userModel.getOrganization().get('user_count') - 1;
    } else {
      var users = [];

      // Grab all ids from every group
      _.each(this._acl.where({type: 'group'}), function (group) {
        var entity = group.get('entity');
        Array.prototype.push.apply(users, entity.users.pluck('id'));
      }, this);

      // Grab all ids from every user
      _.each(this._acl.where({type: 'user'}), function (group) {
        var entity = group.get('entity');
        users.push({
          username: entity.get('username'),
          avatarUrl: entity.get('avatar_url')
        });
      }, this);

      // remove current user id because it can be part of a group
      users = _.without(users, this._userModel.get('id'));

      // counts unique ids
      return _.unique(users);
    }
  },

  _runAction: function () {
    this._renderLoadingView();

    tableDeleteOperation({
      onSuccess: this._onSuccessDestroyDataset.bind(this, this._modalModel),
      onError: this._onErrorDestroyDataset.bind(this),
      visModel: this._visModel
    });
  },

  _renderLoadingView: function () {
    this.$el.html(
      renderLoading({
        title: _t('dataset.delete.loading', { tableName: this._tableModel.getUnquotedName() })
      })
    );
  },

  _onSuccessDestroyDataset: function () {
    window.location = this._configModel.get('base_url') + '/dashboard';
  },

  _onErrorDestroyDataset: function (mdl, e) {
    var errorMessage = errorParser(e);
    var errorView = new ErrorView({
      title: _t('dataset.delete.error', { tableName: this._tableModel.getUnquotedName() }),
      desc: errorMessage || _t('components.error.default-desc')
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  }
});
