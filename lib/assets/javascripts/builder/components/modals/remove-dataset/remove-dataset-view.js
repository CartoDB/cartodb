var _ = require('underscore');
var moment = require('moment');
var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var MapcardPreview = require('builder/helpers/mapcard-preview');
var ErrorView = require('builder/components/error/error-view');
var renderLoading = require('builder/components/loading/render-loading');
var tableDeleteOperation = require('builder/dataset/operations/table-delete-operation');
var template = require('./remove-dataset.tpl');
var errorParser = require('builder/helpers/error-parser');
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
        organizationAffected: affectedEntitiesData.organizationAffected,
        affectedEntitiesCount: affectedEntitiesData.count,
        visibleAffectedEntities: affectedEntitiesData.data.slice(0, AFFECTED_ENTITIES_SAMPLE_COUNT),
        maxVisCount: AFFECTED_VIS_COUNT,
        maxEntitiesCount: AFFECTED_ENTITIES_SAMPLE_COUNT
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
    var affectedEntities = {
      organizationAffected: false,
      count: 0,
      data: []
    };
    var organization;

    if (types.indexOf('org') > -1) {
      organization = this._userModel.getOrganization();
      affectedEntities.organizationAffected = true;
      affectedEntities.count = organization.get('user_count') - 1;
      if (organization.get('avatar_url')) {
        affectedEntities.data.push({
          avatarUrl: organization.get('avatar_url'),
          username: organization.get('display_name')
        });
      }
    } else {
      var users = [];
      var uniqueUsers = [];
      var userName = this._userModel.get('username');

      // Grab all ids from every group
      _.each(this._acl.where({type: 'group'}), function (group) {
        var entity = group.get('entity');
        var groupUsers = _.map(entity.users.models, function (user) {
          return {
            username: user.get('username'),
            avatarUrl: user.get('avatar_url')
          };
        });
        users = users.concat(groupUsers);
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
      users = _.filter(users, function (user) {
        return user.username !== userName;
      });

      // return only uniques
      uniqueUsers = _.uniq(users, function (item) {
        return item.username;
      });

      affectedEntities.count = uniqueUsers.length;
      affectedEntities.data = uniqueUsers;
    }

    return affectedEntities;
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
      title: _t('dataset.delete.error', {
        tableName: this._tableModel.getUnquotedName(),
        error: errorMessage
      }),
      desc: errorMessage || _t('components.error.default-desc')
    });
    this.$el.html(errorView.render().el);
    this.addView(errorView);
  }
});
