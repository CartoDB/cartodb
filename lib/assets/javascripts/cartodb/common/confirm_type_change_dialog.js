

cdb.admin.ConfirmTypeChangeDialog = cdb.ui.common.Dialog.extend({

  _TEXTS: {
    _TITLE: 'Confirm type change',
    _DESCRIPTION: 'Unconvertible data will be lost. Are you sure?',
    _OK: 'Yes, do it',
    _CANCEL: 'Cancel'

  },
  events: {
    'click .ok'                     : 'ok',
    'click .cancel'                 : 'cancel',
    'click .close'                  : 'cancel'
  },

  initialize: function() {

    // We need "this" in these functions
    _.bindAll(this, "ok", "cancel");

    _.extend(this.options, {
      title: this._TEXTS._TITLE,
      description: this._TEXTS._DESCRIPTION,
      template_name: 'common/views/confirm_type_change_dialog',
      clean_on_hide: true,
      ok_button_classes: "button green enabled",
      ok_title: this._TEXTS._OK,
      cancel_button_classes: "underline margin15",
      cancel_title: this._TEXTS._CANCEL,
      modal_type: "confirmation",
      width: 500
    });
    this.elder('initialize');
  },


  /**
   * Render the content for the create dialog
   */
  render_content: function() {  },

  // When you click in the ok button
  ok: function(ev) {
    this.killEvent(ev);
    this.dfd.resolve();
    this.clean();
  },

  cancel: function(ev) {
    this.killEvent(ev);
    this.dfd.reject();
    this.clean();
  },

  confirm: function($el) {
    this.dfd =  $.Deferred();
    this.render().$el.appendTo($el);
    return this.dfd.promise();
  }

})
