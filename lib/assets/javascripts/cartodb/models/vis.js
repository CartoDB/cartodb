
cdb.admin.Visualization = cdb.core.Model.extend({

  defaults: {
    bindMap: true
  },

  urlRoot: '/api/v1/viz',

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'privacy'
  ],

  initialize: function() {
    this.map = new cdb.admin.Map();

    // Check if there are related tables and generate the collection
    if (this.get('type') == "derived" && this.get('related_tables')) this.generateRelatedTables();

    // Check if there are dependant visualizations and generate the collection //
    // TODO //

    if (this.get('bindMap')) this._bindMap();
    this.on(_(this.INHERIT_TABLE_ATTRIBUTES).map(function(t) { return 'change:' + t }).join(' '),  this._changeAttributes, this);
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
    options = options || {}
    if (this.get('type') == "derived") {

      if (!options.force && this.get('related_tables')) {
        this.generateRelatedTables(callback);
        return;
      }

      var self = this;
      this.fetch({
        success: function() {
          self.generateRelatedTables(callback)
        },
        error: callback && callback.error && callback.error
      })
    }
  },

  // _getDependantVisualizations: function() {

  // },

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

  viewUrl: function() {
    return "/viz/" + this.id + "/";
  },

  /**
   *  Is this model a true visualization?
   */
  isVisualization: function() {
    return this.get('type') === "derived";
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
    this.set({ map_id: new_vis.map.id });
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
      this.copy({ name: this.get('name') }, callbacks);
    } else {
      self.notice('', '', 1000);
    }
    return this;
  },

  toJSON: function() {
    var attr = _.clone(this.attributes);
    delete attr.bindMap;
    delete attr.stats;
    delete attr.related_tables;
    attr.map_id = this.map.id;
    return attr;
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
    return "/viz/" + this.get('id') + "/public_map";
  },

  embedURL: function() {
    return "/viz/" + this.get('id') + "/embed_map";
  },

  notice: function(msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  error: function(msg, resp) {
    this.trigger('notice', msg, 'error');
  }
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
      tag_name  : "",
      q         : "",
      page      : 1,
      type      : "derived",
      per_page  : this._ITEMS_PER_PAGE
    });

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
    return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
  },

  url: function() {
    var u = '/api/v1/viz/';
    u += "?" + this._createUrlOptions();
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
