
cdb.admin.Visualization = cdb.core.Model.extend({

  urlRoot: '/api/v1/visualizations',

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'description', 'tags', 'privacy'
  ],

  // defaults: {
  //   map_id:           null,
  //   active_layer_id:  null,
  //   name:             "Untitled",
  //   description:      "",
  //   tags:             "",
  //   privacy:          "PUBLIC",
  //   type:             "table"
  // },

  initialize: function() {
    this.map = new cdb.admin.Map();
    this.on('change:map_id', this._fetchMap, this);
    this.on(_(this.INHERIT_TABLE_ATTRIBUTES).map(function(t) { return 'change:' + t }).join(' '),  this._changeAttributes, this);
    this.map.bind('change:id', function() {
      this.set('map_id', this.map.id);
    }, this);
    this.map.set('id', this.get('map_id'));
  },

  /**
   *  Is this model a true visualization?
   */
  isVisualization: function() {
    return this.get('type') === "derived";
  },
  
  /**
   *  Transform a table visualization/model to a original visualization
   */
  changeToVisualization: function(callback) {
    var self = this
    if (!this.isVisualization()) {
      var callbacks = {
        success: function(new_vis) {
          self.set(new_vis.attributes, { silent: true });
          self.set({ map_id: new_vis.map.id });
          self.notice('', '', 1000);
          callback && callback(self);
        },
        error: function(e) {
          self.error('error changing to visualization', e);
        }
      }
      this.copy(callbacks.success, callbacks.error);
    } else {
      self.notice('', '', 1000);
    }
    return this;
  },

  toJSON: function() {
    var attr = _.clone(this.attributes);
    attr.map_id = this.map.id;
    return attr;
  },

  /**
   *  Create a copy of the visualization model
   */
  copy: function(success, error) {
    // New visualization copy
    var vis = new cdb.admin.Visualization(_.clone(this.attributes));

    // Clone object attributes
    vis.set({
      tags: _.clone(this.attributes.tags)
    }, {
      silent: true
    });

    // Clone map
    var _map = this.map.clone(vis.map)
      , self = this;

    _map.save(null, {
      wait: true,
      silent: true, // dont fetch layer because the id change
      success: function(c) {
        vis.save({
          type: "derived" 
        });
        _map.saveLayers({
          success: function() {
            success && success(vis);
          },
          error: error
        });
      },
      error: function(e){
        error && error(e);
      }
    });

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
          var attrs = _.pick(self.changedAttributes(), self.INHERIT_TABLE_ATTRIBUTES);
          if(attrs.tags && attrs.tags.join) attrs.tags = attrs.tags.join(',');
          layer.table.save(attrs , {
            wait: true,
            success: function(c) {
              // Check with real data
              // It prevents server changes due to, for example, encoding names
              self.set(c, { silent: true });
            },
            error: function(e){
              self.set(self.previousAttributes(), { silent: true });
            }
          });
        }
      })
    }
  },


  // PUBLIC FUNCTIONS

  embedURL: function() {
    return "/visualizations/" + this.get('name') + "/embed_map";
  },

  notice: function(msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  error: function(msg, resp) {
    var err =  resp && JSON.parse(resp.responseText).errors[0];
    this.trigger('notice', msg + " " + err, 'error');
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

  _VISUALIZATIONS_PER_PAGE: 9,

  initialize: function() {
    this.options = new cdb.core.Model({
      tag_name  : "",
      q         : "",
      page      : 1,
      type      : 'table',
      per_page  : this._VISUALIZATIONS_PER_PAGE
    });

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
      this.options.set({"page": total + 1});
    } else if (this.options.get("page") < 1) {
      this.options.set({"page": 1});
    }
  },

  _createUrlOptions: function() {
    return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
  },

  url: function() {
    var u = '/api/v1/visualizations/';
    u += "?" + this._createUrlOptions();
    return u;
  },

  remove: function(options) {
    this.total_entries--;
    this.elder('remove', options);
  },

  parse: function(response) {
    this.total_entries = response.total_entries;
    return response.visualizations;
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
