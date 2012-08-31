


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
      _.bindAll(this, "render", "_addPrivacySelector");

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      this.model.bind('destroy', this.clean, this);
      this.model.bind('change', this.render, this);

      this.bind("clean", this._reClean, this);
    },


    render: function() {
      var self = this;

      this.$el.html(this.template(this.model.toJSON()));

      this.$el.droppable({
        hoverClass: "drop",
        drop: function( event, ui ) {
          var tag = $(ui.helper).text()
            , tags = self.model.get("tags").split(",")
            , included = false;

          for (var i=0,l=tags.length; i<l; i++) {
            if (tags[i] == tag) 
              included = true;            
          }

          if (!included)
            self.model.save({tags: tags + "," + tag});
        }
      });

      return this;
    },


    /**
     * Create the privacy selector after a "privacy link" clicked
     */ 
    _addPrivacySelector: function(ev) {
      ev.preventDefault();

      this.privacy && this.privacy.clean();

      // Add privacy selector
      var privacy = this.privacy = new cdb.admin.PrivacySelector({
        model: this.model,
        limitation: this.options.limitation
      });
      cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

      this.$el.append(this.privacy.render().el);

      this.privacy.show(ev.target);

      return false;
    },


    /**
     * Show delete confirmation after decides delete a table
     */ 
    _showDeleteConfirmation: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var delete_dialog = new cdb.admin.DeleteDialog({
        model: this.model
      });

      $("body").append(delete_dialog.render().el);
      delete_dialog.open();
    },


    /**
     * Destroy droppable funcionality when el is being cleaned
     */
    _reClean: function() {
      this.$el.droppable("destroy");
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
        user: this.user**   // it needs it to know if the user has limitations or not
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
      this.model.bind('loading',  this._showLoader, this);
    },


    render: function() {
      var self = this;
      this.$el.html('');
      this._updateListHeader();
      if (this.model.length > 0) {
        this.model.each(function(m) {
          self._addTable(m);
        });  
      } else {
        this._addEmpty();
      }
    },


    _addEmpty: function() {
      this.$el.append(cdb.templates.getTemplate('dashboard/views/table_list_empty'))
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
        title += " with tag <a class='remove' href='#/'>" + this.model.options.attributes.tag_name + "</a>";

      if (this.model.options.attributes.q != "")
        title += " with <a class='remove' href='#/'>" + this.model.options.attributes.q +  "</a> found";
      
      if (this.model.options.attributes.q == "" && this.model.options.attributes.tag_name == "")
        title += " in your account";

      $("section.tables > div.head > h2").html(title);
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
