var _ = require('underscore');
var moment = require('moment');
var ConfirmationView = require('../confirmation/modal-confirmation-view');
var VisDefinitionModel = require('../../../data/vis-definition-model');
var MapcardPreview = require('../../../helpers/mapcard-preview');
var template = require('./remove-dataset.tpl');
var REQUIRED_OPTS = [
  'modalModel',
  'userModel',
  'visModel',
  'tableModel',
  'configModel'
];
var AFFECTED_VIS_COUNT = 3;
var AFFECTED_ENTITIES_SAMPLE_COUNT = 10;

/**
 *  Remove dataset modal dialog
 */
module.exports = ConfirmationView.extend({
  className: 'Dialog-content',

  events: function () {
    return _.extend({}, ConfirmationView.prototype.events, {
      'click [data-event=exportMapAction]': '_exportMap'
    });
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._acl = this._visModel._permissionModel.acl;
  },

  render: function () {
    var self = this;
    var affectedVisData = this._tableModel.get('owned_dependent_derived_visualizations');
    var affectedEntitiesData = this._prepareVisibleAffectedEntities();

    this.clearSubViews();

    this.$el.html(
      template({
        modalModel: self._modalModel,
        loadingTitle: _t('dataset.delete.loading', { tableName: self._tableModel.getUnquotedName() }),
        tableName: self._tableModel.getUnquotedName(),
        affectedVisCount: affectedVisData.length,
        visibleAffectedVis: self._prepareVisibleAffectedVis(affectedVisData.slice(0, AFFECTED_VIS_COUNT)),
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
        previewUrl: MapcardPreview.url_for_static_map(this._configModel.get('maps_api_template'), vis, 304, 96)
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
  }
});
