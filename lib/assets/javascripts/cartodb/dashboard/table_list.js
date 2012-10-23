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
      _.bindAll(this, "render", "deleting", "deleted", "_addPrivacySelector", "removeTag", "_showDeleteConfirmation");

      _.defaults(this.options, this.default_options);

      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      // this.model.bind('destroy', this.clean, this);
      // this.model.bind('change', this.render, this);

      this.bind("clean", this._reClean, this);
    },


    render: function() {
      var self = this;
      self.cleanTooltips();
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

          self.$el.removeClass('alreadyContainsTag').find('.right.tags a').removeClass('exists');
        },
        over: function(ev, ui) {
          var tag = $(ui.helper).text();
          self.$('.right.tags a').map(function(i,e) {
            var $element = $(e);
            if($element.html() == tag) {
              alreadyInserted = true;
              $element.addClass('exists');
              self.$el.addClass('alreadyContainsTag');
            }
          });
        },
        out: function() {
          self.$el.removeClass('alreadyContainsTag').find('.right.tags a').removeClass('exists');
        }
      });

      this.assignDraggables();
      return this;
    },
    /**
     * Hides the content and show a notification saying the table is being deleted
     * @triggers deleting
     * @return undefined
     */
    deleting: function() {
      self.cleanTooltips();
      this.trigger('deleting', this.model);
      // this.$('div').slideUp();
      this.$el.addClass('disabled');
      // var notificationTpl =
      //   '<p class="dark">Your table (' + this.model.get("name") + ') is being deleted ... <img src="/assets/layout/loader-white.gif"/></p>' +
      //   '<a class="smaller close" href="#close">x</a>';
      // var $container = $('<li class="flash"></li>');
      // this.$el.after($container);
      // this.deletingNotification = new cdb.ui.common.Notification({
      //   el: $container,
      //   timeout:0,
      //   template: notificationTpl,
      //   hideMethod: 'fadeOut',
      // });
      // this.deletingNotification.open('slideDown');
    },

    /**
     * Close the "deleting" notification and warns the user that the table has been deleted
     * @triggers deleted
     * @return undefined
     */
    deleted: function() {
      self.cleanTooltips();
      this.trigger('deleted', this.model);
      this.$el.html('');
      // this.deletingNotification.hide();
      var notificationTpl =
        '<p class="dark">Your table (' + this.model.get("name") + ') has been deleted</p>' +
        '<a class="smaller close" href="#close">x</a>';
      var $container = $('<li class="flash"></li>');
      this.$el.after($container);
      this.notification = new cdb.ui.common.Notification({
        el: $container,
        timeout:3000,
        template: notificationTpl,
        hideMethod: 'slideUp',
      });
      this.notification.open('slideDown');

    },



    assignDraggables: function() {
        this.$('span.tags a').draggable({
        zIndex:9999,
        opacity: 1,
        helper: function(ev) {
          return $( "<a class='tag' href='#'>" + $(ev.currentTarget).html() + "</a>" );
        },
        start: function() {
          $('.removeTags').animate({opacity:1, height:"18px", padding:"10px 10px 10px 10px", borderWidth:"1px"},50);
        },
        stop: function() {
          $('.removeTags').animate({opacity:0, height:"0px", padding:"0px 0px 0px 10px", borderWidth:0},50);
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
      this.model.trigger('tagRemoved')

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
      var self = this;
      ev && (ev.preventDefault());
      this.trigger('deleteDialog');
      this.delete_dialog = new cdb.admin.DeleteDialog({
        model: this.model,
        ok: function() {
          self.deleted();
        }
      });

      $("body").append(this.delete_dialog.render().el);
      this.delete_dialog.open();
      this.delete_dialog.bind('deleting', self.deleting)
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
      "click li:not('.disabled') a.delete": "markForDeletion"
    },

    initialize: function() {
      window.tl =  this;
      _.bindAll(this, "render", "_updateListHeader", "_addAll", "_addTable", "_removeAllPrivacy", "markForDeletion");
      _.defaults(this.options, this.default_options);

      this.model.bind('reset',    this._addAll, this);
      // this.model.bind('loading',  this._showLoader, this);
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
      this._hideLoader();
      if(!this.modelLoaded) {
        this.modelLoaded = true;
        this.render();
      } else {
        this._updateListHeader()
        if(this.model.length == 0) {
          this.render();
        }
      }
    },


    /**
     * Add single table view
     */
    _addTable: function(m) {
      var self = this;
      var li = new TableView({ model: m, limitation: !this.options.user.get("private_tables") });
      li.bind('removePrivacy', this._removeAllPrivacy);
      this.$el.append(li.render().el);
      this.addView(li);
      this._updateListHeader();
      li.bind('deleted', function() {})
      li.bind('deleting', function(model) {
        self.model.remove(model);
        self._showLoader();
        self._addAll();
      })
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
