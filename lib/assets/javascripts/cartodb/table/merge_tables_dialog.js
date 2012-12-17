  /**
   * Shows a dialog to start merging two tables
   *  new MergeTablesDialog({
   *    model: table
   *  })
   *
   */

  cdb.admin.MergeTablesDialog = cdb.admin.BaseDialog.extend({

    // events: {
    //   "keydown input":    "_checkEnter",
    //   "focusin input":    "_focusIn",
    //   "focusout input":   "_focusOut",
    //   "click .ok.button": "ok",
    //   "click .cancel":    "_cancel",
    //   "click .close":     "_cancel"
    // },

    FILTERED_COLUMNS: ['cartodb_id', 'created_at', 'updated_at', 'the_geom_webmercator', 'cartodb_georef_status'],

    initialize: function() {

      var self = this;

      _.extend(this.options, {
        template_name: 'table/views/merge_tables_dialog_base',
        title: _t("Merge with another table"),
        description: _t(""),
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey",
        ok_title: _t("Next"),
        modal_type: "creation tables_selector",
        width: 633,
        modal_class: 'merge_tables_dialog'
      });

      this.constructor.__super__.initialize.apply(this);

      this.state = 0;
    },


    render_content: function() {
      var $content = $(this.getTemplate('table/views/merge_tables_content')(this.model.toJSON()));

      // Create actual table column preview
      var actual_table = this.actual_table = new cdb.admin.TableColumnSelector({
        el: $content.find('.actual_table'),
        model: this.model,
        choose_table_text: '',
        filteredColumns: this.FILTERED_COLUMNS
      }).render();
      this.addView(actual_table);

      // Create merge table component
      var merge_table = this.merge_table = new cdb.admin.TableColumnSelector({
        el: $content.find('.merge_table'),
        url: '/api/v1/tables/',
        choose_table_text: 'Choose a table to merge with ' + this.model.get("name"),
        filteredColumns: this.FILTERED_COLUMNS
      }).render();
      this.addView(merge_table);

      return $content;
    },



    _generateSQL: function() {
      var sql   = "SELECT "
        , self  = this;

      // Add actual table columns
      _.each(this.actual_table.mergeColumns, function(col){
        sql+= self.actual_table.table_name + "." + col + ",";
      });

      // Add merge table columns
      _.each(this.merge_table.mergeColumns, function(col){
        sql+= self.merge_table.table_name + "." + col + " AS " + self.merge_table.table_name + "_" + col  + "_pene" + ",";
      });

      sql = sql.slice(0,sql.length-1);

      // LEFT JOIN
      sql += " FROM " + this.actual_table.table_name + " LEFT JOIN " + this.merge_table.table_name + " ON ";

      // JOIN FIELD
      sql += this.actual_table.table_name + "." + this.actual_table.keyColumn + "=" + this.merge_table.table_name + "." + this.merge_table.keyColumn;

      return sql;
    },


    /**
     *  Start duplication of the table
     */
    _startMerging: function() {
      var self = this
        , data = {
          table_name: "table_merge_inventada",
          sql: this._generateSQL()
        }


      $.ajax({
        type: "POST",
        url: "/api/v1/imports",
        data: data,
        success: function(r) {
          self._importCopy(r.item_queue_id)
        },
        error: function(e) {
          try {
            self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);  
          } catch(e) {
            self._showError('99999','Unknown', 'Sorry, something went wrong and we\'re not sure what. Contact us at <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.');
          }
          
        }
      });
    },


    /**
     *  Starts duplication copy
     */
    _importCopy: function(item_queue_id) {
      var self = this
        , imp = this.importation = new cdb.admin.Import({item_queue_id: item_queue_id})
              .bind("importComplete", function(e){
                imp.unbind();
                window.location.href = "/tables/" + imp.get("table_id") + "/";
              },this)
              .bind("importError", function(e){
                self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
              },this);

      imp.pollCheck();
    },


    /**
     *  Show the error when duplication fails
     */
    _showError: function(number,description,wadus) {
      // Add data
      var template = cdb.templates.getTemplate("dashboard/views/error_dialog_content")
        , opts = {number: number, description: description, about:wadus};

      this.$el.find("div.error_content").html(template(opts));

      // Show error and hide importation window
      this._changeState();
    },



    /**
     *  Changes state, just animate the change and add to state 1 (yes, always it goes forward, never backward)
     */
    _changeState: function() {
      // Next state
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



    /**
     *  When clicks on ok button or submit input
     */
    _ok: function(ev) {
      debugger;
      if (ev) {ev.preventDefault()}

      ++this.state;

      if (this.state == 2) {console.log('merging?'); this._startMerging()}

      this._changeState();
    }
  });