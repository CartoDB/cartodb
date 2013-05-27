
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

  initialize: function() {

    this.options = _.extend({
      title: "Delete this table",
      content: 'You are about to delete this table. Doing so will result in the deletion of this dataset. We recommend you <a class="export" href="#export_data">export it</a> before deleting it.',
      template_name: 'common/views/delete_dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: "Delete this table",
      cancel_button_classes: "underline margin15 export",
      cancel_title: "Export",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'delete_table_dialog'
    }, this.options);

    this.elder('initialize');
    _.bindAll(this, 'ok');
  },

  render_content: function() {
    return this.getTemplate('common/views/delete_table_dialog')(this.options);
  },

  /**
   *  Generate sql url
   */
  _getSqlApiUrl: function() {
    var sql = '';
    var baseUrl = this.options.config.sql_api_protocol + '://' + this.options.config.sql_api_domain
      + ':'
      + this.options.config.sql_api_port
      + '/api/v1/sql?';
    if(this.model.sqlView) {
      sql = this.model.sqlView.getSQL();
    } else {
      sql = "select * from " + this.model.get('name')
    }
    baseUrl += 'q='+sql;
    if(this.options.user_data) {
      baseUrl += '&api_key=' + this.options.user_data.api_key;
    }
    return baseUrl;
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

   if(ev) ev.preventDefault();

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
