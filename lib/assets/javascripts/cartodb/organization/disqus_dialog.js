/**
 * Disqus help dialog (extends Dialog)
 *
 */

cdb.admin.DisqusDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.bindAll(this, '_ok');

    _.extend(this.options, {
      title: "Help setting up your comments",
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

  render_content: function() {
    return this.getTemplate('organization/views/disqus_help_dialog')();
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