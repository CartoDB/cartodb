
/*
 * this model is created to manage the visualization order. In order to simplify API
 * the order is changed using a double linked list instead of a order attribute.
 */
cdb.admin.VisualizationOrder = cdb.core.Model.extend({

  url: function(method) {
    return this.visualization.url(method) + "/next_id"
  },

  initialize: function () {
    this.visualization = this.get('visualization');
    //set id so PUT is used
    this.set('id', this.visualization.id);
    this.unset('visualization');
  }
});

cdb.admin.Visualization = cdb.core.Model.extend({

  defaults: {
    bindMap: true
  },

  url: function(method) {
    var version = cdb.config.urlVersion('visualization', method);
    var base = '/api/' + version + '/viz';
    if (this.isNew()) {
      return base;
    }
    return base + '/' + this.id;
  },

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'description', 'privacy'
  ],

  initialize: function() {
    this.map = new cdb.admin.Map();

    this.permission = new cdb.admin.Permission(this.get('permission'));
    this.overlays = new cdb.admin.Overlays([]);
    this.overlays.vis = this;

    this.initSlides();
    this.bind('change:type', this.initSlides);

    this.transition = new cdb.admin.SlideTransition(this.get('transition_options'), { parse: true });
    this.order = new cdb.admin.VisualizationOrder({ visualization: this });

    // Check if there are related tables and generate the collection
    if (this.get('type') === "derived" && this.get('related_tables')) this.generateRelatedTables();

    // Check if there are dependant visualizations and generate the collection //
    // TODO //

    if (this.get('bindMap')) this._bindMap();
    this.on(_(this.INHERIT_TABLE_ATTRIBUTES).map(function(t) { return 'change:' + t }).join(' '),  this._changeAttributes, this);

    this._initBinds();
  },

  initSlides: function() {
    if (this.slides) return this;
    // slides only for derived visualizations
    // and working with map enabled
    if (this.get('type') === 'derived' && this.get('bindMap')) {
      this.slides = new cdb.admin.Slides(this.get('children'), { visualization: this });
      this.slides.initializeModels();
    } else {
      this.slides = new cdb.admin.Slides([], { visualization: this });
    }
    return this;
  },

  activeSlide: function(c) {
    if (c >= 0 && c < this.slides.length) {
      this.slides.setActive(this.slides.at(c));
    }
    return this;
  },

  // set master visualization. Master manages id, name and description changes
  setMaster: function(master_vis) {

    var self = this;

    master_vis.bind('change:id', function() {
      self.changeTo(master_vis);
      self.slides.master_visualization_id = master_vis.id;
    }, this);

    master_vis.bind('change', function() {
      var c = master_vis.changedAttributes();
      if (c.type) self.set('type', master_vis.get('type'));
      self.set('description', master_vis.get('description'));
      if (c.name) self.set('name', master_vis.get('name'));
      if (c.privacy) self.set('privacy', master_vis.get('privacy'));
    });

  },

  enableOverlays: function() {
    this.bind('change:id', this._fetchOverlays, this);
    if (!this.isNew()) this._fetchOverlays();
  },

  _fetchOverlays: function() {
    this.overlays.fetch({ reset: true });
  },

  _initBinds: function() {
    this.permission.acl.bind('reset', function() {
      // Sync the local permission object w/ the raw data, so vis.save don't accidentally overwrites permissions changes
      this.set('permission', this.permission.attributes, { silent: true });
      this.trigger('change:permission', this);
    }, this);

    // Keep permission model in sync, e.g. on vis.save
    this.bind('change:permission', function() {
      this.permission.set(this.get('permission'));
    }, this);
  },

  isLoaded: function() {
    return this.has('privacy') && this.has('type');
  },


  generateRelatedTables: function(callback) {
    var tables = this.get('related_tables');

    if (tables.length) {
      var collection = new Backbone.Collection([]);

      for (var i = 0, l = tables.length; i < l; i++) {
        var table = new cdb.admin.CartoDBTableMetadata(tables[i]);
        collection.add(table);
      }

      this.related_tables = collection;
      callback && callback.success && callback.success();
    }
  },

  getRelatedTables: function(callback, options) {
    options = options || {};
    if (this.get('type') === "derived") {

      if (!options.force && this.get('related_tables')) {
        this.generateRelatedTables(callback);
        return;
      }

      var self = this;
      this.fetch({
        success: function() {
          self.generateRelatedTables(callback);
        },
        error: callback && callback.error && callback.error
      });
    }
  },

  /**
   * Get table metadata related to this vis.
   * Note that you might need to do a {metadata.fetch()} to get full data.
   *
   * @returns {cdb.admin.CartoDBTableMetadata} if this vis represents a table
   * TODO: when and when isn't it required to do a fetch really?
   */
  tableMetadata: function() {
    if (!this._metadata) {
      this._metadata = new cdb.admin.CartoDBTableMetadata(this.get('table'));
    }
    return this._metadata;
  },

  _bindMap: function() {

    this.on('change:map_id', this._fetchMap, this);

    this.map.bind('change:id', function() {
      this.set('map_id', this.map.id);
    }, this);

    this.map.set('id', this.get('map_id'));

    // when the layers change we should reload related_tables
    this.map.layers.bind('change:id remove', function() {
      this.getRelatedTables(null, {
        force: true
      });
    }, this);

  },

  /**
   *  Is this model a true visualization?
   */
  isVisualization: function() {
    return this.get('type') === "derived" || this.get('type') === 'slide';
  },

  /**
   *  Change current visualization by new one without
   *  creating a new instance.
   *
   *  When turn table visualization to derived visualization,
   *  it needs to wait until reset layers. If not, adding a new
   *  layer after create the new visualization won't work...
   *
   */
  changeTo: function(new_vis, callbacks) {
    this.set(new_vis.attributes, { silent: true });

    this.transition.set(new_vis.transition.attributes);

    var success = function() {
      this.map.layers.unbind('reset', success);
      this.map.layers.unbind('error', error);
      callbacks && callbacks.success && callbacks.success(this);
    };

    var error = function() {
      this.map.layers.unbind('reset', success);
      this.map.layers.unbind('error', error);
      callbacks && callbacks.error && callbacks.error();
    }

    this.map.layers.bind('reset', success, this);
    this.map.layers.bind('error', error, this)
    this.permission.set(new_vis.permission.attributes);
    this.set({ map_id: new_vis.get('map_id') });

    // Get related tables from the new visualization
    this.getRelatedTables();
  },

  /**
   *  Transform a table visualization/model to a original visualization
   */
  changeToVisualization: function(callback) {
    var self = this;
    if (!this.isVisualization()) {
      var callbacks = {
        success: function(new_vis) {
          self.changeTo(new_vis, callback);
          self.notice('', '', 1000);
        },
        error: function(e) {
          var msg = 'error changing to visualization';
          self.error(msg, e);
          callback && callback.error(e, msg);
        }
      };
      // Name is not saved in the back end, due to that
      // we need to pass it as parameter
      this.copy({ name: this.get('name'), description: this.get('description') }, callbacks);
    } else {
      self.notice('', '', 1000);
    }
    return this;
  },

  parse: function(data) {
    if (this.transition && data.transition_options) {
      this.transition.set(this.transition.parse(data.transition_options));
    }

    return data;
  },

  toJSON: function() {
    var attr = _.clone(this.attributes);
    delete attr.bindMap;
    delete attr.stats;
    delete attr.related_tables;
    delete attr.children;
    attr.map_id = this.map.id;
    attr.transition_options = this.transition.toJSON();
    return attr;
  },

  /**
   *  Create a child (slide) from current visualization. It clones layers but no overlays
   */
  createChild: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};
    var vis = new cdb.admin.Visualization(
      _.extend({
          copy_overlays: false,
          type: 'slide',
          parent_id: this.id
        },
        attrs
      )
    );
    vis.save(null, options);
    return vis;
  },

  /**
   *  Create a copy of the visualization model
   */
  copy: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};
    var vis = new cdb.admin.Visualization(
      _.extend({
          source_visualization_id: this.id
        },
        attrs
      )
    );
    vis.save(null, options);
    return vis;
  },

  /**
   *  Fetch map information
   */
  _fetchMap: function() {
    this.map
      .set('id', this.get('map_id'))
      .fetch();
  },

  /**
   *  Generic function to catch up new attribute changes
   */
  _changeAttributes: function(m, c) {
    if (!this.isVisualization()) {

      // Change table attribute if layer is CartoDB-layer
      var self = this;

      this.map.layers.each(function(layer) {
        if (layer.get('type').toLowerCase() == "cartodb") {

          // If there isn't any changed attribute
          if (!self.changedAttributes()) { return false; }

          var attrs = _.pick(self.changedAttributes(), self.INHERIT_TABLE_ATTRIBUTES);

          if (attrs) layer.fetch();
        }
      })
    }
  },


  // PUBLIC FUNCTIONS

  publicURL: function() {
    var url = this.permission.owner.viewUrl();
    return url + "/viz/" + this.get('id') + "/public_map";
  },

  deepInsightsUrl: function(user) {
    var url = user.viewUrl();
    return url + "/bivisualizations/" + this.get('id') + "/embed_map";
  },

  embedURL: function() {
    var url = this.permission.owner.viewUrl();
    return url + "/viz/" + this.get('id') + "/embed_map";
  },

  vizjsonURL: function() {
    var url = this.permission.owner.viewUrl();
    var version = cdb.config.urlVersion('vizjson', 'read', 'v2');
    return url + '/api/' + version + '/viz/' + this.get('id') + "/viz.json";
  },

  notice: function(msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  error: function(msg, resp) {
    this.trigger('notice', msg, 'error');
  },

  // return: Array of entities (user or organizations) this vis is shared with
  sharedWithEntities: function() {
    return _.map((this.permission.acl.toArray() || []), function(aclItem) {
      return aclItem.get('entity')
    });
  },

  privacyOptions: function() {
    if (this.isVisualization()) {
      return cdb.admin.Visualization.ALL_PRIVACY_OPTIONS;
    } else {
      return _.reject(cdb.admin.Visualization.ALL_PRIVACY_OPTIONS, function(option) {
        return option === 'PASSWORD';
      });
    }
  },

  isOwnedByUser: function(user) {
    return user.equals(this.permission.owner);
  },

  /**
   * Get the URL for current instance.
   * @param {Object} currentUser (Optional) Get the URL from the perspective of the current user, necessary to
   *   correctly setup URLs to tables.
   * @return {Object} instance of cdb.common.Url
   */
  viewUrl: function(currentUser) {
    var owner = this.permission.owner;
    var userUrl = this.permission.owner.viewUrl();

    // the undefined check is required for backward compability, in some cases (e.g. dependant visualizations) the type
    // is not available on the attrs, if so assume the old behavior (e.g. it's a visualization/derived/map).
    if (this.isVisualization() || _.isUndefined(this.get('type'))) {
      var id = this.get('id')
      if (currentUser && currentUser.id !== owner.id && this.permission.hasAccess(currentUser)) {
        userUrl = currentUser.viewUrl();
        id = owner.get('username') + '.' + id;
      }
      return new cdb.common.MapUrl({
        base_url: userUrl.urlToPath('viz', id)
      });
    } else {
      if (currentUser && this.permission.hasAccess(currentUser)) {
        userUrl = currentUser.viewUrl();
      }
      return new cdb.common.DatasetUrl({
        base_url: userUrl.urlToPath('tables', this.tableMetadata().getUnquotedName())
      });
    }
   },

  /**
   * Returns the URL, server-side generated
   */
  _canonicalViewUrl: function() {
    var isMap = this.isVisualization() || _.isUndefined(this.get('type'));
    var UrlModel = isMap ? cdb.common.MapUrl : cdb.common.DatasetUrl;
    return new UrlModel({
      base_url: this.get('url')
    });
  }

}, {

  ALL_PRIVACY_OPTIONS: [ 'PUBLIC', 'LINK', 'PRIVATE', 'PASSWORD' ]

});





/**
 * Visualizations endpoint available for a given user.
 *
 * Usage:
 *
 *   var visualizations = new cdb.admin.Visualizations()
 *   visualizations.fetch();
 *
 */

cdb.admin.Visualizations = Backbone.Collection.extend({

  model: cdb.admin.Visualization,

  _PREVIEW_TABLES_PER_PAGE: 10,
  _TABLES_PER_PAGE: 20,
  _PREVIEW_ITEMS_PER_PAGE: 3,
  _ITEMS_PER_PAGE: 9,

  initialize: function() {

    var default_options = new cdb.core.Model({
      tag_name        : "",
      q               : "",
      page            : 1,
      type            : "derived",
      exclude_shared  : false,
      per_page        : this._ITEMS_PER_PAGE
    });

    // Overrriding default sync, preventing
    // run several request at the same time
    this.sync = Backbone.syncAbort;
    this.options = _.extend(default_options, this.options);

    this.total_entries = 0;

    this.options.bind("change", this._changeOptions, this);
    this.bind("reset",          this._checkPage, this);
    this.bind("update",         this._checkPage, this);
    this.bind("add",            this._fetchAgain, this);

  },

  getTotalPages: function() {
    return Math.ceil(this.total_entries / this.options.get("per_page"));
  },

  _checkPage: function() {
    var total = this.getTotalPages();
    var page = this.options.get('page') - 1;

    if (this.options.get("page") > total ) {
      this.options.set({ page: total + 1});
    } else if (this.options.get("page") < 1) {
      this.options.set({ page: 1});
    }

  },

  _createUrlOptions: function() {
    return _.compact(_(this.options.attributes).map(
      function(v, k) {
        return k + "=" + encodeURIComponent(v)
      }
    )).join('&');
  },

  url: function(method) {
    var u = '';

    // TODO: remove this workaround when bi-visualizations are included as
    // standard visualizations
    if (this.options.get('deepInsights')) {
      u += '/api/v1/bivisualizations';
      u += '?page=' + this.options.get('page') + '&per_page=' + this.options.get("per_page");
    } else {
      var version = cdb.config.urlVersion('visualizations', method);
      u += '/api/' + version + '/viz/';
      u += "?" + this._createUrlOptions();
    }

    return u;
  },

  remove: function(options) {
    this.total_entries--;
    this.elder('remove', options);
  },

  // add bindMap: false for all the visulizations
  // vis model does not need map information in dashboard
  parse: function(response) {
    this.total_entries = response.total_entries;
    this.slides && this.slides.reset(response.children);
    this.total_shared = response.total_shared;
    this.total_user_entries = response.total_user_entries;
    return _.map(response.visualizations, function(v) {
      v.bindMap = false;
      return v;
    });
  },

  _changeOptions: function() {
    // this.trigger('updating');

    // var self = this;
    // $.when(this.fetch()).done(function(){
    //   self.trigger('forceReload')
    // });
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

    $.when(Backbone.Collection.prototype.fetch.call(this,opts))
    .done(function(res) {
      self.trigger('loaded');
      dfd.resolve();
    }).fail(function(res) {
      self.trigger('loadFailed');
      dfd.reject(res);
    });

    return dfd.promise();
  }
});
