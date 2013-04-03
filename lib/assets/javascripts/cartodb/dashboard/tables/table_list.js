
  /**
   *  Tables list 
   *
   *  It will show the user tables in a list
   *
   *  Usage example:
   *
   *  var tableList = new cdb.admin.dashboard.TableList({
   *    el: this.$('#tablelist'),
   *    collection: this.tables,
   *    user: this.user   // it needs it to know if the user has limitations or not
   *  });
   *
   */

  /*
    TODO list:

      - Order list by created_at / updated_at.
      - Create a new visualization from the scratch.
      - Compress the list.
      - When delete a visualization show the red block.
      - Show loader when load visualizations.
  */


  cdb.admin.dashboard.TableList = cdb.core.View.extend({

    tagName: 'ul',

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      this.clearSubViews();
      var self = this;

      this.collection.each(function(table) {
        var table_item = new cdb.admin.dashboard.TableItem({
          model: table
        })
        .bind('remove', function() {
          self.collection.remove(this.model);
        });
        
        self.$el.append(table_item.render().el);
        
        self.addView(table_item);
      });
    }
  });



  
  /**
   * Single table item in dashboard tables list
   *
   * Usage example:
   *
   *  var li = new cdb.admin.dashboard.TableItem({
   *    model: table_model,
   *    limitation: !this.options.user.get("private_tables")
   *  });
   *
   */

  cdb.admin.dashboard.TableItem = cdb.core.View.extend({
    
    tagName: 'li',

    events: {
      'click a.delete': '_deleteTable'
    },

    initialize: function() {
      _.bindAll(this, '_destroy');
      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');
    },

    render: function() {
      var attrs = this.model.toJSON();
      attrs.table_size = this._bytesToSize(attrs.table_size);
      
      this.$el.append(this.template(attrs));
      this.$('a.delete').tipsy({ gravity: 's', fade: true });
      
      return this;
    },

    _deleteTable: function(e) {
      this.killEvent(e);
      this.trigger('remove');

      // var dlg = new cdb.admin.dashboard.DeleteVisualizationDialog();
      // this.$el.append(dlg.render().el);

      // dlg.ok = this._destroy;
      // dlg.open();
    },

    _destroy: function() {
      this.model.destroy();
      this.remove();
    },

    clean: function() {
      //this.$('a.delete').tipsy('destroy');
      cdb.core.View.prototype.clean.call(this);
    },


    // Help functions
    _bytesToSize: function(by) {
      var bytes = parseInt(by.toString())
        , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes == 0) return '0 KB';
      var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      var value = (bytes / Math.pow(1024, i)).toFixed(2);

      if (value % 1 == 0) {
        value = parseInt(value)
      }

      return value + " " + sizes[i];
    }
  })







  // cdb.admin.dashboard.TableList = cdb.core.View.extend({
    
  //   tagName: 'ul',

  //   _TABLES_PER_PAGE: cdb.admin.Tables.prototype._TABLES_PER_PAGE,





  //   initialize: function() {

  //     _.bindAll(this, "render", "partialRender", "appendTableByNumber", "_showLoader", "_hideLoader",
  //       "_updateListHeader", "_addAll", "_addTable", "_removeAllPrivacy",
  //       "markForDeletion", "clear");

  //     _.defaults(this.options, this.default_options);

  //     this.model  = new cdb.core.Model();
  //     this.tables = this.options.tables;

  //     this.add_related_model(this.tables);

  //     this.bindEvents();
  //   },

  //   bindEvents: function() {
  //     this.model.bind('change:visible', this._toggleVisibility, this);

  //     this.tables.bind('reset', this._addAll, this);
  //     this.tables.bind('reset change add remove', this._updateListHeader, this);
  //     this.tables.bind('updating', this._showLoader, this);
  //     this.tables.bind('reset change add remove', this._hideLoader, this);
  //     this.tables.bind('elementAdded', this.partialRender, this);
  //     this.tables.bind('remove', this.refreshTable, this);
  //   },

  //   render: function() {
  //     var self = this;
  //     this.$el.html('');
  //     this._subviews = {};
  //     this._updateListHeader();
  //     if (this.tables.length > 0) {
  //       this.tables.each(function(m, i) {
  //         // if we are on the same position that the deleted table was, we insert the notification
  //         self._addTable(m);
  //         // each time a tag is removed or added, we forward the event to be able to refresh the tag list
  //         self.retrigger('change',m, 'reset');
  //       });
  //     } else {
  //       this._addEmpty();
  //     }
  //   },

  //   _addEmpty: function() {
  //     this.$el.append(cdb.templates.getTemplate('dashboard/views/table_list_empty'))
  //   },

  //   /**
  //    * Add all list
  //    */
  //   _addAll: function() {
  //     this.render();
  //     this._hideLoader();
  //   },

  //   /**
  //    * Add single table view
  //    */
  //   _addTable: function(m) {
  //     var self = this;
  //     if(!this.hasTable(m.get('name'))) {
  //       var li = new cdb.admin.dashboard.TableView({ model: m, config: this.options.config, limitation: !this.options.user.get("private_tables") });
  //       this.$el.append(li.render().el);
  //       this.addView(li);
  //       this._updateListHeader();

  //       li.bind('change:privacy', this._removeAllPrivacy);
  //       this.retrigger('saving', li, 'updating');
  //       this.retrigger('saved', li, 'updated');
  //       this.retrigger('destroy', li, 'updating');
  //       this.retrigger('remove', this.tables, 'updated');
  //     }
  //   }


  //   /**
  //    * Update the counter of tables
  //    */
  //   _updateListHeader: function(sync) {
  //     var title =  "<i></i>" + this.tables.total_entries + " " + ( this.tables.total_entries != 1 ? "tables" : "table" );

  //     if (this.tables.options.attributes.tag_name != "")
  //       title += " with tag <a class='remove' href='#/'>" + decodeURIComponent(this.tables.options.attributes.tag_name) + "</a>";

  //     if (this.tables.options.attributes.q != "")
  //       title += " with <a class='remove' href='#/'>" + this.tables.options.attributes.q +  "</a> found";

  //     if (this.tables.options.attributes.q == "" && this.tables.options.attributes.tag_name == "")
  //       title += " in your account";

  //     $("section.tables > div.head > h2").html(title);
  //   },


  //   /**
  //    *  Show the loader when the table model is operating
  //    */
  //   _showLoader: function() {
  //     $("section.tables > div.head > div.loader").fadeIn();
  //   },


  //   /**
  //    *  Hide the loader when the table model is operating
  //    */
  //   _hideLoader: function() {
  //     $("section.tables > div.head > div.loader").fadeOut();
  //   },

  //   clear: function() {
  //     this.$el.html('<li></li>');
  //   },

  //   _toggleVisibility: function() {
  //     if (this.model.get("visible")) this._show();
  //     else this._hide();
  //   },

  //   _show: function() {
  //     this.$el.css("opacity", 1);
  //     this.$el.fadeIn(250);
  //   },

  //   _hide: function() {
  //     this.$el.fadeOut(250, function() {
  //       $(this).css("opacity", 0);
  //     });
  //   }
  // });
















  // @todo: This should be moved to a common library
  /**
   *  String prototype extend to represent property table size
   */
  // String.prototype.bytesToSize = function() {
  //   var bytes = parseInt(this.toString())
  //     , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  //   if (bytes == 0) return '0 KB';
  //   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  //   var value = (bytes / Math.pow(1024, i)).toFixed(2);

  //   if (value % 1 == 0) {
  //     value = parseInt(value)
  //   }

  //   return value + " " + sizes[i];
  // }



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
  // cdb.admin.dashboard.TableView = cdb.core.View.extend({

  //   tagName: 'li',

  //   events: {
  //     "click a.status": "_addPrivacySelector",
  //     "click a.delete:not(.disabled)": "_confirmAndDelete"
  //   },


  //   initialize: function() {
  //     _.bindAll(this, "render", "deleting", "deleted", "_addPrivacySelector", "_confirmAndDelete");

  //     _.defaults(this.options, this.default_options);

  //     this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

  //     this.retrigger('saving', this.model);
  //     this.retrigger('saved', this.model);

  //     this.model.bind('change', this.render);
  //     this.bind("clean", this._reClean, this);
  //   },


  //   render: function() {
  //     var self = this;
  //     this.cleanTooltips();
  //     this.$el.html(this.template(this.model.toJSON()));
  //     this.$el.addClass('tableRow');
  //     return this;
  //   },

  //   clean: function() {
  //     this.trigger('clean');
  //     this.elder('clean');
  //   },

  //   /**
  //    * Create the privacy selector after a "privacy link" clicked
  //    */
  //   _addPrivacySelector: function(ev) {
  //     ev && (ev.preventDefault());
  //     this.trigger('change:privacy');

  //     this.privacy && this.privacy.clean();

  //     // this.options.limitation = true
  //     // Add privacy selector
  //     var privacy = this.privacy = new cdb.admin.PrivacySelector({
  //       model: this.model,
  //       limitation: this.options.limitation,
  //       upgrade_url: 'https://' + config.account_host + "/account/" + username + "/upgrade"
  //       // isn't any other way to catch the username than from a global?
  //     });

  //     cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

  //     this.$el.append(this.privacy.render().el);

  //     this.privacy.show(ev.target);

  //     return false;
  //   },


  //   /**
  //    * Show delete confirmation after decides delete a table
  //    */
  //   _confirmAndDelete: function(ev) {
  //     var self = this;
  //     ev && (ev.preventDefault());
  //     this.delete_dialog = new cdb.admin.DeleteDialog({
  //       model: this.model,
  //       config: this.options.config
  //     });
  //     $("body").append(this.delete_dialog.render().el);
  //     this.delete_dialog.open();

  //     this.delete_dialog.wait()
  //       .done(this.deleteTable.bind(this))
  //       .fail(this.cleanDeleteDialog.bind(this));
  //   },

  //   /**
  //    * Hides the content and show a notification saying the table is being deleted
  //    * @triggers deleting
  //    * @return undefined
  //    */
  //   deleting: function() {
  //     this.cleanTooltips();
  //     this.$el.addClass('disabled');
  //     this.$('a').addClass('disabled');
  //   },

  //   /**
  //    * Close the "deleting" notification and warns the user that the table has been deleted
  //    * @triggers deleted
  //    * @return undefined
  //    */
  //   deleted: function() {
  //     this.cleanTooltips();
  //     this.$el.html('');

  //     var notificationTpl =
  //       '<p class="dark">Your table (' + this.model.get("name") + ') has been deleted</p>' +
  //       '<a class="smaller close" href="#close">x</a>';
  //     var $container = $('<li class="flash"></li>');
  //     this.$el.after($container);
  //     this.notification = new cdb.ui.common.Notification({
  //       el: $container,
  //       timeout:3000,
  //       template: notificationTpl,
  //       hideMethod: 'fadeOut',
  //       showMethod: 'fadeIn'
  //     });

  //     this.notification.open();
  //     this.$el.remove();
  //     this.clean();
  //   },

  //   cleanDeleteDialog: function() {
  //     this.delete_dialog.clean();
  //   },

  //   deleteTable: function() {
  //     var self = this;
  //     this.deleting();
  //     this.model.destroy({wait: true})
  //       .done(this.deleted);
  //   },


  //   /**
  //    * Destroy droppable funcionality when el is being cleaned
  //    */
  //   _reClean: function() {
  //     this.$el.droppable("destroy");
  //   }
  // });