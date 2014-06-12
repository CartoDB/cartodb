
/**
 *  Privacy dialog view for tables and visualizations
 *
 *
 */


cdb.admin.PrivacyDialog = cdb.admin.BaseDialog.extend({

  // events: function(){
  //   // return _.extend({},cdb.admin.BaseDialog.prototype.events,{
  //   //   'click ul > li > a': '_optionClicked'
  //   // });
  // },

  _TEXTS: {
    title:    _t("Privacy settings"),
    ok_title: _t("Save settings")
  },

  initialize: function() {

    _.bindAll(this, 'ok');

    // Can user change the privacy of the table?
    var limitation = 
      this.options.user &&
      this.options.user.get("actions") &&
      !this.options.user.get("actions").private_tables;

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
      modal_class: 'vis_privacy_dialog',
      limitation: limitation
    }, this.options);

    this.elder('initialize');
    this.add_related_model(this.model);
  },

  render_content: function() {

    // Privacy selector :)
    var selector = new cdb.admin.VisPrivacySelector({
      model:  this.model,
      user:   this.options.user
    });
    this.$('.vis_privacy_selector').append(selector.render().el);

    // Users list (REVIEW!)
    if (this.options.user.organization) {
      var userlist = new cdb.admin.UserList({
        permission: this.model.permission,
        organization: this.options.user.organization
      });
      this.$('.org_users_list').append(userlist.render().el);
    }
  },


  _ok: function(ev) {
   if (ev) { ev.preventDefault(); }

    if (this.ok) {
      this.ok();
    }

    this.hide();
  },


  ok: function(ev) {
    this.killEvent(ev);
    this._save();
  }

});
