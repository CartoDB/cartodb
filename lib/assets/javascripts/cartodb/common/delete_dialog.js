
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
      'click a.export':             '_showExport',
      'click .modal.export nav a':  'hide'
    });
  },

  initialize: function() {
    _.extend(this.options, {
      title: "Delete this table",
      description: '',
      template_name: 'common/views/delete_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Delete this table",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'delete_table_dialog'
    });
    this.elder('initialize');
    _.bindAll(this, 'ok');
  },

  render_content: function() {
    return this.getTemplate('common/views/delete_table_dialog')();
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
    // Add data
    var template = this.getTemplate("common/views/export_table_dialog")
      , opts = {table_id : this.model.get("id")}

    this.$el.find(".modal:eq(1)").find("div.export_content").html(template({sqlUrl:this._getSqlApiUrl()}));

    // Show error and hide importation window
    this.$el.find(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },function(){
      $(this).remove();
    });

    this.$el.find(".modal:eq(1)")
      .css({
        opacity:0,
        display:"block",
        marginTop: "0px"
      })
      .animate({
        opacity: 1,
        marginTop: "100px"
      },600);
  },

  ok: function(ev) {
    var self = this;
    this.trigger('deleting');

    this.model.destroy({
      success: function() {
        self.trigger('deleted');
        self.options.ok && self.options.ok();
      }
    });
  }
});
