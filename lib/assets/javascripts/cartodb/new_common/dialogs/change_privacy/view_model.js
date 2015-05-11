var cdb = require('cartodb.js');
var _ = require('underscore');
var PrivacyOptions = require('./options_collection');

/**
 * View model for a change privacy dialog
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    vis: undefined,
    user: undefined,
    state: 'Start',
    hasPermissionsChanged: false,
    privacyOptions: undefined
  },

  initialize: function(attrs) {
    if (!attrs.vis) {
      throw new Error('vis is required');
    }
    if (!attrs.user) {
      throw new Error('user is required');
    }
    this.set('privacyOptions', PrivacyOptions.byVisAndUser(attrs.vis, attrs.user));

    if (attrs.user.organization) {
      this._setupSharePrerequisities();
    }
  },

  changeState: function(newState) {
    // Force a change event
    this.set('state', undefined, { silent: true });
    this.set('state', newState);
  },

  canShare: function() {
    return !!this.get('permission');
  },

  usersUsingVis: function() {
    var metadata = this.get('vis').tableMetadata();
    return _.chain(_.union(
        metadata.get('dependent_visualizations'),
        metadata.get('non_dependent_visualizations')
      ))
      .compact()
      .map(function(d) {
        return d.permission.owner;
      })
      .value();
  },

  shouldShowShareBanner: function() {
    return this.get('user').organization;
  },

  shouldRenderDialogWithExpandedLayout: function() {
    return this.get('state') === 'Share';
  },

  canChangeWriteAccess: function() {
    return !this.get('vis').isVisualization();
  },

  canSave: function() {
    return this.get('privacyOptions').selectedOption().canSave();
  },

  save: function() {
    var selectedOption = this.get('privacyOptions').selectedOption();
    if (selectedOption.canSave()) {
      this.changeState('Saving');
      var self = this;
      selectedOption.saveToVis(this.get('vis'))
        .done(function() {
          self.get('hasPermissionsChanged') ? self._savePermissionChanges() : self._saveDone();
        })
        .fail(this._saveFail.bind(this));
    }
  },

  _setupSharePrerequisities: function() {
    var vis = this.get('vis');
    this.set('permission', vis.permission.clone());
    this.get('permission').acl.bind('all', function() {
      this.set('hasPermissionsChanged', true);
    }, this);

    if (!vis.isVisualization()) {
      var self = this;
      vis.tableMetadata().fetch({
        silent: true,
        success: function() {
          if (self.get('state') === 'Share') {
            self.changeState('Share');
          }
        }
      });
    }
  },

  _savePermissionChanges: function() {
    var originalPermission = this.get('vis').permission;
    originalPermission.overwriteAcl(this.get('permission'));
    originalPermission.save()
      .done(this._saveDone.bind(this))
      .fail(this._saveFail.bind(this));
  },

  _saveDone: function() {
    this.changeState('SaveDone');
  },

  _saveFail: function() {
    this.changeState('SaveFail');
  }

});
