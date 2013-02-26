(function() {

  // @todo: This should be moved to a common library
  /**
   *  String prototype extend to represent property table size
   */
  String.prototype.bytesToSize = function() {
    var bytes = parseInt(this.toString())
      , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 KB';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    var value = (bytes / Math.pow(1024, i)).toFixed(2);

    if (value % 1 == 0) {
      value = parseInt(value)
    }

    return value + " " + sizes[i];
  }



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
      "click a.delete:not(.disabled)": "_confirmAndDelete"
    },


    initialize: function() {
      _.bindAll(this, "render", "deleting", "deleted", "_addPrivacySelector", "_confirmAndDelete");

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      this.retrigger('saving', this.model);
      this.retrigger('saved', this.model);

      this.model.bind('change', this.render);
      this.bind("clean", this._reClean, this);
    },


    render: function() {
      var self = this;
      this.cleanTooltips();
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass('tableRow');
      return this;
    },

    clean: function() {
      this.trigger('clean');
      this.elder('clean');
    },

    /**
     * Create the privacy selector after a "privacy link" clicked
     */
    _addPrivacySelector: function(ev) {
      ev && (ev.preventDefault());
      this.trigger('change:privacy');

      this.privacy && this.privacy.clean();

      // this.options.limitation = true
      // Add privacy selector
      var privacy = this.privacy = new cdb.admin.PrivacySelector({
        model: this.model,
        limitation: this.options.limitation,
        upgrade_url: '/account/'+username+'/upgrade'
        // isn't any other way to catch the username than from a global?
      });

      cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

      this.$el.append(this.privacy.render().el);

      this.privacy.show(ev.target);

      return false;
    },


    /**
     * Show delete confirmation after decides delete a table
     */
    _confirmAndDelete: function(ev) {
      var self = this;
      ev && (ev.preventDefault());
      this.delete_dialog = new cdb.admin.DeleteDialog({
        model: this.model,
        config: this.options.config
      });
      $("body").append(this.delete_dialog.render().el);
      this.delete_dialog.open();

      this.delete_dialog.wait()
        .done(this.deleteTable.bind(this))
        .fail(this.cleanDeleteDialog.bind(this));
    },

    /**
     * Hides the content and show a notification saying the table is being deleted
     * @triggers deleting
     * @return undefined
     */
    deleting: function() {
      this.cleanTooltips();
      this.$el.addClass('disabled');
      this.$('a').addClass('disabled');
    },

    /**
     * Close the "deleting" notification and warns the user that the table has been deleted
     * @triggers deleted
     * @return undefined
     */
    deleted: function() {
      this.cleanTooltips();
      this.$el.html('');

      var notificationTpl =
        '<p class="dark">Your table (' + this.model.get("name") + ') has been deleted</p>' +
        '<a class="smaller close" href="#close">x</a>';
      var $container = $('<li class="flash"></li>');
      this.$el.after($container);
      this.notification = new cdb.ui.common.Notification({
        el: $container,
        timeout:3000,
        template: notificationTpl,
        hideMethod: 'fadeOut',
        showMethod: 'fadeIn'
      });

      this.notification.open();
      this.$el.remove();
      this.clean();
    },

    cleanDeleteDialog: function() {
      this.delete_dialog.clean();
    },

    deleteTable: function() {
      var self = this;
      this.deleting();
      this.model.destroy({wait: true})
        .done(this.deleted);
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
        tables: this.tables*,
        user: this.user**   // it needs it to know if the user has limitations or not
      });

      *   It needs a tables model to run correctly.
      **  It needs a user model to work properly.
   */

  var TableList = cdb.core.View.extend({
    tagName: 'ul',

    _TABLES_PER_PAGE: cdb.admin.Tables.prototype._TABLES_PER_PAGE,

    events: {
      "click li:not('.disabled') a.delete": "markForDeletion"
    },

    initialize: function() {
      window.tl =  this;

      _.bindAll(this, "render", "partialRender", "appendTableByNumber", "_showLoader", "_hideLoader",
        "_updateListHeader", "_addAll", "_addTable", "_removeAllPrivacy",
        "markForDeletion", "clear");

      _.defaults(this.options, this.default_options);

      this.model  = new cdb.core.Model();
      this.tables = this.options.tables;

      this.add_related_model(this.tables);

      this.bindEvents();
    },

    bindEvents: function() {
      this.model.bind('change:visible', this._toggleVisibility, this);

      this.tables.bind('reset', this._addAll, this);
      this.tables.bind('reset change add remove', this._updateListHeader, this);
      this.tables.bind('updating', this._showLoader, this);
      this.tables.bind('reset change add remove', this._hideLoader, this);
      this.tables.bind('elementAdded', this.partialRender, this);
      this.tables.bind('remove', this.refreshTable, this);
    },

    render: function() {
      var self = this;
      this.$el.html('');
      this._subviews = {};
      this._updateListHeader();
      if (this.tables.length > 0) {
        this.tables.each(function(m, i) {
          // if we are on the same position that the deleted table was, we insert the notification
          self._addTable(m);
          // each time a tag is removed or added, we forward the event to be able to refresh the tag list
          self.retrigger('change',m, 'reset');
        });
      } else {
        this._addEmpty();
      }
    },

    showDeletedNotification: function() {
      var self = this;
      if(this.lastMarkedForDeletion) {
        this.$('.notificationContainer').remove();

        var notificationTpl =
          '<p class="dark">Your table (' + this.lastMarkedForDeletion.name + ') has been deleted</p>' +
          '<a class="smaller close" href="#close">x</a>';

        var $container = $('<li class="flash"></li>');
        this.$el.append($container);
        if(this.notification && this.notification.destroy) {
          this.notification.removeData().unbind().remove().clean();
          delete this.notification;
        }
        this.notification = new cdb.ui.common.Notification({
          el: $container,
          timeout:10000,
          template: notificationTpl,
          hideMethod: 'fadeOut',
        });
        this.notification.unbind('notificationDeleted');
        this.notification.bind('notificationDeleted', function() {
          self.notificationShowing = false;
        })
        if(self.notificationShowing) {
          self.notification.open();
          self.notificationShowing = true;
        } else {
          self.notification.open('', function() {
            self.notificationShowing = true;
          });
        }

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
     * HACK-ATTACK: This is a hack to avoid problems with synchronization when the user is deleting tables.
     * If the user is serial-deleting tables, the table list can go temporally out of sync, if the user make
     * some actions between the table deletion and the view refresh.
     * This method check if a table is already on the view, to avoid insert it again.
     * @param  {Strubg}  name
     * @return {Boolean}
     */
    hasTable: function(name) {
      for(var n in this._subviews) {
        if(this._subviews[n].model.get('name') === name) {
          return true;
        }
      }
      return false;
    },

    subViewLength: function() {
      var i = 0;
      for(var n in this._subviews) {
        if(this._subviews.hasOwnProperty(n)) {
          i++;
        }
      }
      return i;
    },

    /**
     * Add single table view
     */
    _addTable: function(m) {
      var self = this;
      if(!this.hasTable(m.get('name'))) {
        var li = new TableView({ model: m, config: this.options.config, limitation: !this.options.user.get("private_tables") });
        this.$el.append(li.render().el);
        this.addView(li);
        this._updateListHeader();

        li.bind('change:privacy', this._removeAllPrivacy);
        this.retrigger('saving', li, 'updating');
        this.retrigger('saved', li, 'updated');
        this.retrigger('destroy', li, 'updating');
        this.retrigger('remove', this.tables, 'updated');
      }
    },

    /**
     * Checks if the table is uncompensated (has less tan _TABLES_PER_PAGE entries but has a next page)
     * and if needed, fills the gap
     */
    refreshTable: function() {
      var self = this;
      this.tables.refillTableList(self._TABLES_PER_PAGE)
        .done(function(){
          self.partialRender();
        });
    },

    /**
     * We seriously need to refactor this class to avoid this shit
     */
    partialRender: function() {
      var subViewLength = this.subViewLength();
      for(var i = 0; i < this.tables.length; i++) {
        if(!this.hasTable(this.tables.models[i].get('name'))) {
          this._addTable(this.tables.models[i]);
        }
      }
    },

    /**
     * Extract the n table from model and append it to the view
     * @param  {Integer} n
     */
    appendTableByNumber: function(n) {
      if(this.tables.models[n]) {
        this._addTable(this.tables.models[n]);
      }
    },

    /**
     * Checks if there are more less than _TABLES_PER_PAGE tables loaded (because a deletion)
     * and that there are more tables after the current pages.
     * @return {[type]} [description]
     */
    checkTableListFull: function() {
      if(this.tables.models.length < this._TABLES_PER_PAGE &&
        this.tables.total_entries >= this._TABLES_PER_PAGE) {
          return false;
      }
      return true;
    },


    _removeAllPrivacy: function() {
      for(var v in this._subviews) {
        this._subviews[v].privacy && this._subviews[v].privacy.clean();
      }
    },

    markForDeletion: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var tableInfo = $(ev.currentTarget).parents('.tableRow');

      var tableIndex = this.$('.tableRow').index(tableInfo)
      this.lastMarkedForDeletion = {
        "pos": tableIndex,
        "name": this.$('.tableRow h3 a').html(),
        "li": tableInfo
      };

      self.notificationShowing = false;
      if(this.notification) {
        this.notification.hide()
      }
    },


    /**
     * Update the counter of tables
     */
    _updateListHeader: function(sync) {
      var title =  "<i></i>" + this.tables.total_entries + " " + ( this.tables.total_entries != 1 ? "tables" : "table" );

      if (this.tables.options.attributes.tag_name != "")
        title += " with tag <a class='remove' href='#/'>" + decodeURIComponent(this.tables.options.attributes.tag_name) + "</a>";

      if (this.tables.options.attributes.q != "")
        title += " with <a class='remove' href='#/'>" + this.tables.options.attributes.q +  "</a> found";

      if (this.tables.options.attributes.q == "" && this.tables.options.attributes.tag_name == "")
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
    },

    clear: function() {
      this.$el.html('<li></li>');
    },

    _toggleVisibility: function() {
      if (this.model.get("visible")) this._show();
      else this._hide();
    },

    _show: function() {
      this.$el.css("opacity", 1);
      this.$el.fadeIn(250);
    },

    _hide: function() {
      this.$el.fadeOut(250, function() {
        $(this).css("opacity", 0);
      });
    }

  });

  cdb.admin.dashboard.TableList = TableList;
})();
