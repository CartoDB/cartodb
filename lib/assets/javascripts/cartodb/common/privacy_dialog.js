cdb.admin.PrivacyDialog = cdb.admin.BaseDialog.extend({

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click ul > li > a': '_optionClicked'
    });
  },

  _TEXTS: {
    title: _t("Change privacy"),
    ok_title: _t("Apply changes")
  },

  initialize: function() {

    _.bindAll(this, 'ok', '_optionClicked');

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
      width: 574,
      modal_class: 'change_privacy_dialog',
      limitation: limitation
    }, this.options);

    this.elder('initialize');

    this.add_related_model(this.model);

    this.privacy = this.model.get("privacy");

  },

  render_content: function() {

    if (this.model.get("privacy") === 'PRIVATE') {
      this.$el.find(".private .radiobutton").addClass("selected");
    } else if (this.model.get("privacy") === 'LINK') {
      this.$el.find(".link .radiobutton").addClass("selected");
    } else if (this.model.get("privacy") === 'ORG') {
    } else {
      this.$el.find(".public .radiobutton").addClass("selected");
    }

    if (this.options.limitation) this.$el.find(".private .radiobutton").addClass("disabled");
    if (this.options.limitation) this.$el.find(".link .radiobutton").addClass("disabled");

  },

  _optionClicked: function(ev) {

    ev.preventDefault();

    var $radio = $(ev.target).closest(".radiobutton");
    
    if ($radio.hasClass("disabled")) {
      return;
    }

    this.$el.find(".radiobutton").removeClass("selected");

    $radio.addClass("selected");

    this.privacy = $radio.attr("data-privacy");

    if (this.privacy === 'ORG') {
      // show here the organization user list
      var userlist = new cdb.admin.UserList({
        permission: this.model.permission,
        organization: this.options.user.organization
      });
      //TODOMU: do this properly
      this.$('.content').html(userlist.render().el);
    }

  },

  /**
  * Save privacy
  */
  _save: function() {

    this.model.save({ privacy: this.privacy });

  },

  _ok: function(ev) {

   if (ev) { ev.preventDefault(); }

    if (this.ok) {
      this.ok();
    }

    this.hide();

  },

  /**
   * Returns a promise to allow parent to continue when user clicks button
   * @return {Promise}
   */
  wait: function() {
    this.dfd = $.Deferred();
    return this.dfd.promise();
  },

  ok: function(ev) {
    this.killEvent(ev);
    this._save();
  }

});
