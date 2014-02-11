cdb.admin.PrivacyDialog = cdb.admin.BaseDialog.extend({

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click ul > li > a': '_optionClicked'
    });
  },

  _TEXTS: {
    title: _t("Change privacy"),
    default_message: _t("You are about to delete this table. Doing so will result in the deletion of this dataset."),
    delete_vis_message: _t("You are about to delete this table. Doing so will result in the deletion of this dataset. Also, deleting this layer will affect the following visualizations."),
    //cancel_title: _t("Export my data first"),
    ok_title: _t("Apply changes")
  },

  initialize: function() {

    _.bindAll(this, 'ok', '_optionClicked');

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
      modal_class: 'change_privacy_dialog'
    }, this.options);

    this.elder('initialize');

    this.add_related_model(this.model);

  },

  render_content: function() {
    if (this.model.get("privacy") == 'PRIVATE') this.$el.find(".private .radiobutton").addClass("selected");
    else this.$el.find(".public .radiobutton").addClass("selected")
  },

  _optionClicked: function(ev) {

    ev.preventDefault();

    var $radio = $(ev.target).closest(".radiobutton");

    this.$el.find(".radiobutton").removeClass("selected");

    $radio.addClass("selected");
    this.privacy = $radio.attr("data-privacy");

  },

  /**
  * Save privacy
  */
  _save: function() {

    // New privacy status
    var new_status;
    var status = this.privacy;

    //this.model.set({ privacy: status });
    this.model.save({ privacy: status });

  },

  _ok: function(ev) {

   if (ev) ev.preventDefault();

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
