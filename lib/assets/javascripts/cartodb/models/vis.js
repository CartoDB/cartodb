
cdb.admin.Visualization = cdb.core.Model.extend({

  initialize: function() {
    this.map = new cdb.admin.Map();

    /*this.bind('change:map_id', function() {
      this.map
        .set('id', this.get('map_id'))
        .fetch();
    }, this);
    */

  }

});

/**
* visualizations available for given user
* usage:
* var visualizations = new cbd.admin.Visualizations()
* visualizations.fetch();
*/

cdb.admin.Visualizations = Backbone.Collection.extend({

  model: cdb.admin.CartoDBTableMetadata,

  _ITEMS_PER_PAGE: 20,

  initialize: function() {
    this.options = new cdb.core.Model({
      tag_name  : "",
      q         : "",
      page      : 1,
      per_page  : this._ITEMS_PER_PAGE
    });

    this.total_entries = 0;

    this.options.bind("change", this._changeOptions, this);
    this.bind("reset",          this._checkPage,     this);
    this.bind("update",         this._checkPage,     this);
    this.bind("add",            this._fetchAgain,    this);
  },

  getTotalPages: function() {
    return Math.ceil(this.total_entries / this.options.get("per_page"));
  },

  _fetchAgain: function() {
    this.fetch();
  },

  _checkPage: function() {

    var total = this.getTotalPages();
    var page  = this.options.get('page') - 1;

    if (this.options.get("page") > total ) {
      this.options.set({"page": total + 1});
    } else if (this.options.get("page") < 1) {
      this.options.set({"page": 1});
    }

  },

  _createUrlOptions: function() {
    return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
  },

  url: function() {
    var u = '/api/v1/tables/';
    u += "?" + this._createUrlOptions();
    return u;
  },

  remove: function(options) {
    this.total_entries--;
    this.elder('remove', options);
  },

  parse: function(response) {
    this.total_entries = response.total_entries;
    return response.tables;
  },

  _changeOptions: function() {
    this.trigger('updating');

    var self = this;
    $.when(this.fetch()).done(function(){
      self.trigger('forceReload')
    });
  },

  create: function(m) {
    var dfd = $.Deferred();
    Backbone.Collection.prototype.create.call(this,
      m,
      {
        wait: true,
        success: function() {
          dfd.resolve();

        },
        error: function() {
          dfd.reject();
        }
      }
    );
    return dfd.promise();
  },

  fetch: function(opts) {
    var dfd = $.Deferred();
    var self = this;
    this.trigger("loading", this);
    $.when(Backbone.Collection.prototype.fetch.call(this,opts)).done(function(res) {
      self.trigger('loaded');
      dfd.resolve();
    }).fail(function(res) {
      self.trigger('loadFailed');
      dfd.reject(res);
    });
    return dfd.promise();
  },

  /**
  * Fetch the server for the collection, but not set it afterwards, only returns pases the
  * json throught a deferred object
  * @return {$.Deferred}
  */
  fetchButNotSet: function() {
    var dfd = $.Deferred();
    $.ajax({
      url: this.url(),
      dataType:'json',
      success:function(res){
        dfd.resolve(res);
      },
      error: function() {
        dfd.reject();
      }
    });

    return dfd.promise();
  },

  /**
  * If the number of lists is smaller than size parameter, fetch the list without setting it
  * and ad the last n elements to the collection.
  * This is needed to be able to add new elements to the collection without rewriting (AKA: lose the bindings)
  * the existant models (for example, if want to update the collection, but not re-render the view)
  * @param  {integer} size
  * @return {Promise}
  */
  refillVisualizationList: function(size) {
    var self = this;
    var dfd = $.Deferred();
    var currentSize = this.models.length;
    var elementToAdd = size - currentSize;

    $.when(this.fetchButNotSet()).done(function(res) {
      // we need to update the current size
      var currentSize = self.models.length;
      var limit = res.tables.length >= size ? res.tables.length : size;

      for (var i = 0; i < limit; i++) {
        if (!self.hasVisualization(res.tables[i].name)) {
          self.add(res.tables[i], {silent:true});
        }
      }

      dfd.resolve(true);

    });

    return dfd.promise();
  },

  hasVisualization: function(name) {

    for (var i in this.models)  {
      if (this.models[i].get('name') === name) {
        return true;
      }
    }

    return false;
  }
});

/**
* Single table item in dashboard list
*
* Usage example:
*
var li = new VisualizationView({
model: model*,
limitation: !this.options.user.get("private_tables")
});

* It needs a table model to run correctly.
*
*/
var VisualizationView = cdb.core.View.extend({

  tagName: 'li',

  events: {
    "click a.delete:not(.disabled)": "_confirmAndDelete"
  },

  initialize: function() {
    _.bindAll(this, "render", "deleting", "deleted", "_confirmAndDelete");

    _.defaults(this.options, this.default_options);

    this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');

    this.retrigger('saving', this.model);
    this.retrigger('saved', this.model);

    this.model.bind('change', this.render);
    this.bind("clean", this._reClean, this);
  },


  render: function() {
    var self = this;
    this.cleanTooltips();
    this.$el.html(this.template(this.model.toJSON()));
    this.$el.addClass('tableRow border');
    return this;
  },

  clean: function() {
    this.trigger('clean');
    this.elder('clean');
  },

  /**
  * Show delete confirmation after decides delete a visualization
  */
  _confirmAndDelete: function(ev) {
    var self = this;
    ev && (ev.preventDefault());

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.model,
      title: "Delete this visualization",
      ok_title: "Delete this visualization",
      content: 'You are about to delete this visualization.',
      config: this.options.config
    });

    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
    .done(this.deleteVisualization.bind(this))
    .fail(this.cleanDeleteDialog.bind(this));
  },

  /**
  * Hides the content and show a notification saying the visualization is being deleted
  * @triggers deleting
  * @return undefined
  */
  deleting: function() {
    this.cleanTooltips();
    this.$el.addClass('disabled');
    this.$('a').addClass('disabled');
  },

  /**
  * Close the "deleting" notification and warns the user that the visualization has been deleted
  * @triggers deleted
  * @return undefined
  */
  deleted: function() {
    this.cleanTooltips();
    this.$el.html('');

    var notificationTpl =
    '<p class="dark">Your visualization (' + this.model.get("name") + ') has been deleted</p>' +
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

  deleteVisualization: function() {
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
* Visualizations list in the dashboard
*
* It will show up the user tables in a list
*
* Usage example:
*
var tableList = new cdb.admin.dashboard.VisualizationList({
el: this.$('#tablelist'),
tables: this.tables*,
user: this.user**   // it needs it to know if the user has limitations or not
});

*   It needs a tables model to run correctly.
**  It needs a user model to work properly.
*/

var VisualizationList = cdb.core.View.extend({
  tagName: 'ul',

  _ITEMS_PER_PAGE: cdb.admin.Visualizations.prototype._ITEMS_PER_PAGE,

  events: {
    "click li:not('.disabled') a.delete": "markForDeletion"
  },

  initialize: function() {
    window.tl =  this;

    _.bindAll(this, "render", "partialRender", "appendVisualizationByNumber", "_showLoader", "_hideLoader",
      "_updateListHeader", "_addAll", "_addVisualization", "_removeAllPrivacy",
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
    this.tables.bind('remove', this.refreshVisualization, this);
  },

  render: function() {
    var self = this;
    this.$el.html('');
    this._subviews = {};
    this._updateListHeader();
    if (this.tables.length > 0) {
      this.tables.each(function(m, i) {
        // if we are on the same position that the deleted table was, we insert the notification
        self._addVisualization(m);
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
      '<p class="dark">Your visualization (' + this.lastMarkedForDeletion.name + ') has been deleted</p>' +
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
  hasVisualization: function(name) {
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
  * Add single visualization view
  */
  _addVisualization: function(m) {
    var self = this;
    if(!this.hasVisualization(m.get('name'))) {
      var li = new VisualizationView({ model: m, config: this.options.config, limitation: !this.options.user.get("private_tables") });
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
  * Checks if the table is uncompensated (has less tan _ITEMS_PER_PAGE entries but has a next page)
  * and if needed, fills the gap
  */
  refreshVisualization: function() {
    var self = this;
    this.tables.refillVisualizationList(self._ITEMS_PER_PAGE)
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
      if(!this.hasVisualization(this.tables.models[i].get('name'))) {
        this._addVisualization(this.tables.models[i]);
      }
    }
  },

  /**
  * Extract the n table from model and append it to the view
  * @param  {Integer} n
  */
  appendVisualizationByNumber: function(n) {
    if(this.tables.models[n]) {
      this._addVisualization(this.tables.models[n]);
    }
  },

  /**
  * Checks if there are more less than _ITEMS_PER_PAGE tables loaded (because a deletion)
  * and that there are more tables after the current pages.
  * @return {[type]} [description]
  */
  checkVisualizationListFull: function() {
    if(this.tables.models.length < this._ITEMS_PER_PAGE &&
    this.tables.total_entries >= this._ITEMS_PER_PAGE) {
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

    var tableIndex = this.$('.tableRow').index(tableInfo);

    this.lastMarkedForDeletion = {
      "pos":  tableIndex,
      "name": this.$('.tableRow h3 a').html(),
      "li":   tableInfo
    };

    self.notificationShowing = false;

    if (this.notification) {
      this.notification.hide()
    }

  },


  /**
  * Update the counter of tables
  */
  _updateListHeader: function(sync) {
    var title =  "<i></i>" + this.tables.total_entries + " " + ( this.tables.total_entries != 1 ? "visualizations" : "visualization" );

    if (this.tables.options.attributes.tag_name != "")
      title += " with tag <a class='remove' href='#/'>" + decodeURIComponent(this.tables.options.attributes.tag_name) + "</a>";

    if (this.tables.options.attributes.q != "")
      title += " with <a class='remove' href='#/'>" + this.tables.options.attributes.q +  "</a> found";

    if (this.tables.options.attributes.q == "" && this.tables.options.attributes.tag_name == "")
      title += " created";

    $("section.visualizations > div.head > h2").html(title);
  },


  /**
  * Show the loader when the table model is operating
  */
  _showLoader: function() {
    $("section.visualizations > div.head > div.loader").fadeIn();
  },


  /**
  * Hide the loader when the table model is operating
  */
  _hideLoader: function() {
    $("section.visualizations > div.head > div.loader").fadeOut();
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

cdb.admin.dashboard.VisualizationList = VisualizationList;
