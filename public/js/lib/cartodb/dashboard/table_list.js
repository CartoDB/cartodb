


(function() {

  /**
   * Single table item in dashboard list
   *
   * Usage example:
   *
      var li = new TableView({
        model: model*,
        limitation: !this.options.user.get("private_tables")
      });

      * It needs a table model to run correctly.
   *
   */ 
  var TableView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      "click a.status": "_addPrivacySelector",
      "click a.delete": "_showDeleteConfirmation"
    },


    initialize: function() {
      _.bindAll(this, "_addPrivacySelector");

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      this.model.bind('destroy', this.clean, this);
      this.model.bind('change', this.render, this);
    },


    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      return this;
    },


    /**
     * Create the privacy selector after a "privacy link" clicked
     */ 
    _addPrivacySelector: function(ev) {
      ev.preventDefault();

      // Add privacy selector
      var privacy = this.privacy = new cdb.admin.PrivacySelector({
        model: this.model,
        limitation: this.options.limitation
      });

      this.$el.append(this.privacy.render().el);

      this.privacy.show(ev.target);
    },


    /**
     * Show delete confirmation after decides delete a table
     */ 
    _showDeleteConfirmation: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var delete_dialog = new cdb.admin.DeleteDialog({
        clean_on_hide: true,
        title: "You are about to delete this table",
        content: "You will not be able to recover this information. We really recommend you <a href='#export' class='underline'>export the data</a> before deleting it.",
        ok_button_classes: "button grey",
        ok_title: "Delete this table",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        model: this.model
      });

      $("body").append(delete_dialog.render().el);
      delete_dialog.open();
    }
  });






  /**
   * Tables list in the dashboard
   *
   * It will show up the user tables in a list
   *
   * Usage example:
   *
      var tableList = new cdb.admin.dashboard.TableList({
        el: this.$('#tablelist'),
        model: this.tables*,
        user: this.user**
      });

      *   It needs a tables model to run correctly.
      **  It needs a user model to work properly.
   */
   
  var TableList = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      _.bindAll(this, "_updateListHeader");

      _.defaults(this.options, this.default_options);

      this.model.bind('reset',    this._addAll, this);
      this.model.bind('add',      this._addTable, this);
      this.model.bind('remove',   this._tableRemoved, this);
      this.model.bind('loading',  this._showLoader, this);
    },


    render: function() {
      var self = this;
      this.$el.html('');
      this._updateListHeader();
      this.model.each(function(m) {
        self._addTable(m);
      });
    },


    /**
     * Add all list
     */ 
    _addAll: function() {
      this.render();
      this._hideLoader();
    },


    /**
     * Add single table view
     */ 
    _addTable: function(m) {
      var li = new TableView({ model: m, limitation: !this.options.user.get("private_tables") });
      this.$el.append(li.render().el);
      this.addView(li);
      this._updateListHeader();
    },


    /**
     * After a table removed
     */ 
    _tableRemoved: function() {
      this._updateListHeader();
    },


    /**
     * Update the counter of tables
     */ 
    _updateListHeader: function(sync) {
      var title =  this.model.total_entries + " " + ( this.model.total_entries != 1 ? "tables" : "table" );

      if (this.model.options.attributes.tag_name != "") 
        title += " with the tag \"" + this.model.options.attributes.tag_name + "\"";

      if (this.model.options.attributes.q != "")
        title += " with \"" + this.model.options.attributes.q +  "\" found";
      
      if (this.model.options.attributes.q == "" && this.model.options.attributes.tag_name == "")
        title += " in your account";

      $("section.tables > div.head > h2").text(title);
    },


    /**
     * Show the loader when the table model is operating
     */ 
    _showLoader: function() {
      $("section.tables > div.head > div.loader").fadeIn();
    },


    /**
     * Hide the loader when the table model is operating
     */ 
    _hideLoader: function() {
      $("section.tables > div.head > div.loader").fadeOut();
    }
  });

  cdb.admin.dashboard.TableList = TableList;
})();
