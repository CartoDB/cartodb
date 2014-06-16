
/**
 *  Privacy dialog view for tables and visualizations
 *
 *  - It needs:
 *
 *    · Visualization model (derived or table).
 *    · User model.
 *    
 */


cdb.admin.PrivacyDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title:    _t("Privacy settings"),
    ok_title: _t("Save settings")
  },

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click': '_hideList',
    });
  },

  initialize: function() {
    _.bindAll(this, 'ok');

    if (!this.options.user || !this.model) {
      cdb.log.info("A user and a visualization model are required")
    }

    this.user = this.options.user;

    // Generate model copies preventing
    // UI changes before saving.
    this._genModelClones();

    this.options = _.extend({
      title: this._TEXTS.title,
      content: this._TEXTS.default_message,
      template_name: 'common/views/change_privacy_dialog',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_title,
      cancel_button_classes: "underline margin15 export",
      cancel_title: this._TEXTS.cancel_title,
      width: 490,
      modal_class: 'vis_privacy_dialog'
    }, this.options);

    this.elder('initialize');

    this._bindModels();
    this._checkState();
  },

  render_content: function() {

    // Big privacy selector :)
    this.vis_privacy_selector = new cdb.admin.VisPrivacySelector({
      model:  this.vis_model,
      user:   this.user
    });
    this.$('.vis_privacy_selector').append(this.vis_privacy_selector.render().el);

    // Users list
    if (this.user.organization) {
      this.org_list = new cdb.admin.UserList({
        model:        this.vis_model,
        permission:   this.vis_perm,
        organization: this.user.organization
      });
      this.$('.org_users_list').append(this.org_list.render().el);
    }

    // Password settings view
    if (this.user.get("actions") && this.user.get("actions").private_tables) {
      this.privacy_password = new cdb.admin.PrivacyPassword({
        model: this.vis_model,
        value: 'fake'
      });
      this.$('.foot').append(this.privacy_password.render().el);  
    }
  },

  // Check state and show/hide needed views
  _checkState: function() {
    var privacy = this.vis_model.get('privacy').toLowerCase();

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
      if (this.org_list)          this.org_list.hide();
      if (this.privacy_password)  this.privacy_password.hide();
      return false;
    }

    cdb.log.info('An undefined privacy status was selected - ' + this.vis_model.get('privacy'))
  },


  _hideList: function(e) {
    this.killEvent(e);
    if (this.vis_privacy_selector) this.vis_privacy_selector.hideList();
  },


  _genModelClones: function() {
    this.vis_model = new cdb.core.Model({ privacy: this.model.get('privacy') });

    var perm = _.clone(this.model.permission.attributes);
    delete perm.id;
    this.vis_perm = new cdb.admin.Permission(perm);
  },

  _bindModels: function() {
    this.vis_model.bind('change:privacy', this._checkState, this);
    this.add_related_model(this.vis_model);
  },

  // Save current model state
  _saveModels: function() {
    this.model
      .set("privacy", this.vis_model.get('privacy'))
      .save();

    this.model.permission.acl.reset(this.vis_perm.acl.toJSON())
    this.model.permission.save();
  },

  // Reset models to server state
  _resetModels: function() {},


  _ok: function(ev) {
    if (ev) { ev.preventDefault(); }
    if (this.ok) this.ok()
    this.hide();
  },

  cancel: function(e) {
    if (e) this.killEvent(e);
    this._resetModels();
  },

  ok: function(e) {
    if (e) this.killEvent(e);
    this._saveModels();
  }

});
