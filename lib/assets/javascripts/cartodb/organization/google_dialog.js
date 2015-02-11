/**
 * Google dialog (extends Dialog)
 *
 */

cdb.admin.GoogleDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.bindAll(this, '_ok');

    _.extend(this.options, {
      title: "Change your password",
      description: '',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Ok, thanks",
      cancel_button_classes: "underline margin15",
      width: 602,
      modal_class: 'disqus_dialog'
    });

    this.enable = false;

    this.constructor.__super__.initialize.apply(this);
  },

  render: function() {
    cdb.admin.BaseDialog.prototype.render.call(this);


    if (!can_change_email) {
      this._disableForm();
    }

    return this;
  },

  render_content: function() {
    return this.getTemplate('organization/views/google_dialog')();
  },

  _enableForm: function() {
    this.enable = true;
    this.$el.find("a.ok").removeClass('disabled');
  },

  _disableForm: function() {
    this.enable = false;
    this.$el.find("a.ok").addClass('disabled');
  },

  _ok: function(ev) {
    if(ev) ev.preventDefault();
    this.hide();
  }
});