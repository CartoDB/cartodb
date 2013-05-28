
/**
 * Delete confirmation window (extends Dialog)
 *
 * When you need to delete a table, it needs a confirmation
 *
 * Usage example:
 *
    var delete_dialog = new cdb.admin.DeleteDialog({
      model: table_model
    });
 *
 */

cdb.admin.DeleteDialog = cdb.admin.BaseDialog.extend({

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click .export':             '_showExport',
      'click .modal.export nav a':  'hide'
    });
  },

  _TEXTS: {
    title: _t("Delete this table"),
    default_message: _t('Your are about to delete this table. Please note that if you do it, you will not be able to recover this information.'),
    delete_vis_message: _t("Your are about to delete this table. Please note that if you do it, you will not be able to recover this information and you will possibly break the visualizations below."),
    cancel_title: _t("Export my data first"),
    ok_title: _t("Ok, delete")
  },

  initialize: function() {

    this.options = _.extend({
      title: this._TEXTS.title,
      content: this._TEXTS.default_message,
      template_name: 'common/views/delete_dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_title,
      cancel_button_classes: "underline margin15 export",
      cancel_title: this._TEXTS.cancel_title,
      modal_type: "confirmation",
      width: 510,
      modal_class: 'delete_table_dialog'
    }, this.options);

    this.elder('initialize');
    _.bindAll(this, 'ok');

    this.affected_visualizations = this.model.get("affected_visualizations");

  },

  render_content: function() {

    var $content = $("<div></div>");
    $content.append(this.getTemplate('common/views/delete_table_dialog')(this.options));

    if (this.affected_visualizations && this.affected_visualizations.length > 1) {
      $content.find("p").html(this._TEXTS.delete_vis_message);
    }

    _.each(this.affected_visualizations, function(vis) {
      if (vis.type != 'table') $content.find("ul").append("<li><a href='/viz/" + vis.id + "' target='_blank'>"+ vis.name +"</a></li>");
    });

    return $content;
  },

  /**
   * Show the export window
   */
  _showExport: function(ev) {

    ev.preventDefault();
    var self = this;

    var export_dialog = new cdb.admin.ExportTableDialog({
      model: this.model,
      config: window.config, // BAD! We should pass this as init param!
      user_data: window.user_data, // globals makes baby jesus cry
      autoClose: true
    });

    $("body").append(export_dialog.render().el);

    export_dialog.open();

    self.hide();

    var clean_on_hide = this.options.clean_on_hide;

    this.options.clean_on_hide = false;

    export_dialog.bind('generating', function(text) {
      self.$('p').html(text);
      self.open();
      this.options.clean_on_hide = clean_on_hide;
    });

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
    this.dfd.resolve();
  }

});
