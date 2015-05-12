
/**
 *  Privacy dialog view for tables and visualizations
 *
 *  - It needs:
 *
 *    · Visualization model (derived or table).
 *    · User model.
 * 
 *  new cdb.admin.PrivacyDialog({ model: vis_model, user: user_model })
 *   
 */


cdb.admin.PrivacyDialog = cdb.admin.BaseDialog.extend({

  _DEFAULT_PASSWORD: 'FAKE123456',

  _TEXTS: {
    title:    {
      vis:        _t("Map privacy settings"),
      table:      _t("Dataset privacy settings")
    },
    privacy_change: {
      table:          _t("If you change the privacy of this dataset, you will be deleting or changing the maps of the \
                          following users within your organization:"),
      visualization:  _t("If you change the privacy of this map you will be revoking access to it to the \
                          following users within your organization:"),
    },
    ok_title:         _t("Save settings")
  },

  events: {
    'click .settings-ok.ok':  '_checkPrivacy',
    'click .warning-ok.ok':   '_savePrivacy',
    'click .cancel':          '_cancel',
    'click .close':           '_cancel',
    'click':                  '_hideList'
  },

  initialize: function() {
    _.bindAll(this, 'ok');

    if (!this.options.user || !this.model) {
      cdb.log.info("A user and a visualization model are required")
    }

    this.user = this.options.user;
    this.upgrade_url = window.location.protocol + '//' + this.options.config.account_host + "/account/" + this.user.get('username') + "/upgrade";

    // Generate model copies preventing
    // UI changes before saving.
    this._genModelClones();

    this.options = _.extend({
      title: this.model.isVisualization() ? this._TEXTS.title.vis : this._TEXTS.title.table,
      template_name: 'old_common/views/privacy_dialog/privacy_dialog',
      clean_on_hide: true,
      enter_to_confirm: false,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_title,
      width: 490,
      modal_class: 'vis_privacy_dialog'
    }, this.options);

    this.elder('initialize');

    this._bindModels();
  },

  render_content: function() {

    // Big privacy selector :)
    this.vis_privacy_selector = new cdb.admin.VisPrivacySelector({
      model:        this.vis_model,
      user:         this.user,
      upgrade_url:  this.upgrade_url,
      source:       this.options.source
    });

    this.$('.vis_privacy_selector').append(this.vis_privacy_selector.render().el);

    // Users list
    if (this.user.organization) {
      this.org_list = new cdb.admin.UserOrgList({
        model:        this.vis_model,
        permission:   this.vis_perm,
        user: this.user,
        writePermissionEnabled: !this.model.isVisualization()
      });
      this.$('.org_users_list').append(this.org_list.render().el);
    }

    // Password settings view
    if (this.user.get("actions") && this.user.get("actions").private_tables) {
      this.privacy_password = new cdb.admin.PrivacyPassword({
        vis:            this.vis_model,
        attribute:      'password',
        default_value:  this._DEFAULT_PASSWORD
      });
      this.$('.modal:eq(0) .foot').append(this.privacy_password.render().el);
    }


    // ** Users list warning **
    // If user change privacy to private, we should 
    // warn the user about the visualizations already
    // created with the table or the users that won't 
    // be able to see the visualization again
    var mdl = this.model;
    var type = 'permission';
    
    if (!this.model.isVisualization()) {
      mdl = this.table_data = new cdb.admin.CartoDBTableMetadata({ id: this.model.get("table").id, no_data_fetch: true });
      mdl.fetch();
      type = 'visualizations';
    }

    this.warning_list = new cdb.ui.common.UserListWarning({
      list: [],
      msg:  this._TEXTS.privacy_change[type === "permission" ? 'visualization' : 'table']
    });
    this.$('.warning_users_list').append(this.warning_list.render().el);
    this.addView(this.warning_list);


    // Check state
    this._checkState();
  },

  // Check state and show/hide needed views
  _checkState: function() {
    var privacy = this.vis_model.get('privacy').toLowerCase();

    // Check submit button
    this._checkButton();

    // PUBLIC
    if (privacy === "public") {
      if (this.org_list)          this.org_list.show();
      if (this.privacy_password)  this.privacy_password.hide();
      return false;
    }

    // LINK
    if (privacy === "link") {
      if (this.org_list)          this.org_list.show();
      if (this.privacy_password)  this.privacy_password.hide();
      return false;
    }

    // PASSWORD
    if (privacy === "password") {
      if (this.org_list)          this.org_list.show();
      if (this.privacy_password)  this.privacy_password.show();
      return false;
    }

    // ORG?
    if (privacy === "organization") {
      if (this.org_list)          this.org_list.show();
      if (this.privacy_password)  this.privacy_password.hide();
      return false;
    }

    // PRIVATE
    if (privacy === "private") {
      if (this.org_list)          this.org_list.show();
      if (this.privacy_password)  this.privacy_password.hide();
      return false;
    }

    cdb.log.info('An undefined privacy status was selected - ' + this.vis_model.get('privacy'))
  },

  _checkButton: function() {
    var privacy = this.vis_model.get('privacy').toLowerCase();
    var $ok = this.$('.settings-ok');
    
    if (privacy === "password") {
      var pass = this.vis_model.get('password');
      $ok[ pass ? 'removeClass' : 'addClass' ]('disabled');
    } else {
      $ok.removeClass('disabled');
    }
  },


  _hideList: function(e) {
    this.killEvent(e);
    if (this.vis_privacy_selector) this.vis_privacy_selector.hideList();
  },



  // MODEL STUFF //

  _genModelClones: function() {
    var privacy = this.model.get('privacy');

    this.vis_model = new cdb.core.Model({
      privacy: this.model.get('privacy'),
      isVisualization: this.model.isVisualization(),
      related_tables: this.model.related_tables
    });

    if (privacy.toLowerCase() === "password") {
      this.vis_model.set('password', this._DEFAULT_PASSWORD);
    }

    var perm = _.clone(this.model.permission.attributes);
    delete perm.id;
    this.vis_perm = new cdb.admin.Permission(perm);
  },

  _bindModels: function() {
    this.vis_model.bind('change:password',  this._checkButton, this);
    this.vis_model.bind('change:privacy',   this._checkState, this);
    this.vis_model.bind('change:privacy',   this._resetModels, this);
    this.add_related_model(this.vis_model);
  },

  // Save current model state
  _saveModels: function() {
    var self = this;
    var new_privacy = this.vis_model.get('privacy').toLowerCase();
    this.vis_model.unset('isVisualization');

    // Remove password if the password is not generated by the user
    if (new_privacy === "password" && this.vis_model.get('password') === this._DEFAULT_PASSWORD) {
      this.vis_model.unset('password');
    }

    // save visualization privacy and wait until it finish to
    // save the new acl
    this.model.save(this.vis_model.attributes, { 
      wait: true,
      success: function() {
        // no need to save the acl for users outside an organization
        if (self.options.user.isInsideOrg()) {
          self.model.permission.acl.reset(self.vis_perm.acl.models);
          self.model.permission.save();
        }
      }
    });
  },

  // Get the users affected by the privacy & permission changes
  _getUsersAffected: function() {
    var new_perm_users = this.vis_perm.getUsersWithAnyPermission();

    // If there is a permission for the organization, no users affected!
    if (this.vis_perm.getUsersWithPermission('org').length > 0) { return [] }

    // If the privacy change happens in a visualization
    if (this.model.isVisualization()) { return [] }

    // If the privacy change happens in a table
    if (!this.model.isVisualization()) {
      return this._getRelatedUserVisualizations(new_perm_users)
    }

    // --- No way! --- // 
    return []
  },

  // Get users + visualizations affected by the privacy change
  _getRelatedUserVisualizations: function(perm_users) {
    if (!this.model.isVisualization()) {
      var users = _.pluck(perm_users, 'id');
      var self = this;
      
      // Filter all the dependent visualizations from the table data
      // checking if the owner is not in the new permission users list
      var visualizations = _.union(
        this.table_data.get('dependent_visualizations'),
        this.table_data.get('non_dependent_visualizations')
      );

      return _.compact(
        visualizations.map(function(t){
          if (( self.user.get('id') !== t.permission.owner.id ) && !_.contains(users, t.permission.owner.id)) {
            return {
              id:             t.permission.owner.id,
              type:           'user',
              username:       t.permission.owner.username,
              avatar_url:     t.permission.owner.avatar_url,
              visualizations: [t.name]
            }
          }
        })
      );

    } else {
      return [];  
    }
  },


  // Reset models when privacy status change
  _resetModels: function() {
    var privacy = this.vis_model.get('privacy').toLowerCase();

    if (privacy !== "password") {
      this.vis_model.unset('password');
    }
  },


  // DIALOG STUFF //

  _showWarning: function() {

    this.$("section.modal:eq(0)")
      .animate({
        top:0,
        opacity: 0
      }, 300);

    this.$(".modal.warning")
      .css({
        marginTop: 0,
        display: 'block',
        opacity: 0
      })
      .animate({
        top: "0",
        marginTop: -( this.$(".modal.warning").outerHeight() / 2 )>>1,
        opacity: 1
      }, 300);
  },

  _checkPrivacy: function(e) {
    this.killEvent(e);
    var privacy = this.vis_model.get('privacy').toLowerCase();

    // Check first privacy and password
    if (privacy === "password" && !this.vis_model.get('password')) {
      return false;
    }

    // Check the amount of affected_users
    // if the change is done
    var affected_users = this._getUsersAffected();
    if (affected_users.length > 0 && this.user.isInsideOrg()) {
      this.warning_list.changeList(affected_users);
      this._showWarning();
    } else {
      this._savePrivacy();
    }
  },

  cancel: function(e) {
    if (e) this.killEvent(e);
    this._resetModels();
  },

  _savePrivacy: function(e) {
    this.killEvent(e);
    this._saveModels();
    this.hide();
  },

  // 
  _ok: function() {},
  ok: function() {}

});
