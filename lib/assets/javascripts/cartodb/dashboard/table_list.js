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
      "click a.delete": "_showDeleteConfirmation",
      "removeTag .tags a": "removeTag"
    },


    initialize: function() {
      _.bindAll(this, "render", "_addPrivacySelector", "removeTag");

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      // this.model.bind('destroy', this.clean, this);
      this.model.bind('change', this.render, this);

      this.bind("clean", this._reClean, this);
    },


    render: function() {
      var self = this;
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass('tableRow')
      this.$el.droppable({
        hoverClass: "drop",
        drop: function( ev, ui ) {
          var tag = $(ui.helper).text()
            , tags = self.model.get("tags").split(",")
            , included = false;

          if (tags.indexOf(tag) < 0)
            self.model.save({tags: tags + "," + tag});
        }
      });

      this.assignDraggables();
      this.assignDroppables();

      return this;
    },

    assignDroppables: function() {
      // this selector SHOULD be improved. Talk with product team to define
      // where the droppable areas should be
      $('body *:not("#tablelist *, #tablelist"):not(*:has("#tablelist"))').droppable({
        hoverClass: "drop",
        drop: function( ev, ui ) {
          var tag = $(ui.helper).text();
          // a light delay is needed because if not, when the draggable element
          // is destroyed before the helper div is restored to the original position
          // there's a crash in jquery.
          setTimeout(function() {
            $(ui.draggable).trigger('removeTag');
          }, 25)
          }
      });
    },

    assignDraggables: function() {
        this.$('span.tags a').draggable({
        opacity: 1,
        helper: function(ev) {
          return $( "<a class='tag' href='#'>" + $(ev.currentTarget).html() + "</a>" );
        }
      });
    },

    removeTag: function(ev) {
      var tag = $(ev.currentTarget).html();
      var tags = this.model.get("tags").split(",");
      var position = tags.indexOf(tag);
      if(position > -1) {
        tags.splice(position, 1)
      }
      this.model.save({tags: tags.join(',')});
    },

    clean: function() {
      this.trigger('clean');
      this.super('clean');
    },

    /**
     * Create the privacy selector after a "privacy link" clicked
     */
    _addPrivacySelector: function(ev) {
      ev.preventDefault();
      this.trigger('removePrivacy');

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
    _showDeleteConfirmation: function(ev) {
      ev.preventDefault();
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
      this.clean();
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

    events: {
      "click a.delete": "markForDeletion"
    },

    initialize: function() {
      _.bindAll(this, "_updateListHeader", "_addTable", "_removeAllPrivacy");

      _.defaults(this.options, this.default_options);
      this.model.bind('reset',    this._addAll, this);
      this.model.bind('loading',  this._showLoader, this);
    },


    render: function() {
      var self = this;
      this.$el.html('');
      this._updateListHeader();
      if (this.model.length > 0) {
        this.model.each(function(m, i) {
          // if we are on the same position that the deleted table was, we insert the notification
          if(self.lastMarkedForDeletion) {
            if(self.lastMarkedForDeletion.pos == i) {
              self.showDeletedNotification();
            }
          }
          self._addTable(m);
        });
        // if the lastMarkedForDeletion element was the last from the list, we shoudl add the notification at the end
        if(self.lastMarkedForDeletion && this.model.length <= self.lastMarkedForDeletion.pos) {
          this.showDeletedNotification();
        }
      } else {
        this._addEmpty();
      }
      this.trigger('renderComplete');
    },

    showDeletedNotification: function() {
      if(this.lastMarkedForDeletion) {

        this.$('.notificationContainer').remove();

        var notificationTpl =
          '<p class="dark">Your table (' + this.lastMarkedForDeletion.name + ') has been deleted</p>' +
          '<a class="smaller close" href="#close">x</a>';

        var $container = $('<li class="flash"></li>');
        this.$el.append($container);
        var notification = new cdb.ui.common.Notification({
          el: $container,
          timeout:10000,
          template: notificationTpl,
          hideMethod: 'slideUp'
        });

        this.bind('renderComplete', function() {
          notification.open('slideDown');
        });

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
      li.bind('removePrivacy', this._removeAllPrivacy);
      this.$el.append(li.render().el);
      this.addView(li);
      li.bind('clean', this.showDeletedNotification)
      this._updateListHeader();

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
        "name": this.model.models[tableIndex].get('name'),
        "li": tableInfo
      };
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
