
cdb.admin.Visualization = cdb.core.Model.extend({

  urlRoot: '/api/v1/viz',

  INHERIT_TABLE_ATTRIBUTES: [
    'name', 'privacy'
  ],

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
          callback && callback.success(self);
        },
        error: function(e) {
          self.error('error changing to visualization', e);
          callback && callback.error(e);
        }
      }
      this.copy(callbacks.success, callbacks.error);
    } else {
      self.notice('', '', 1000);
    }
    return this;
  },

  changeToVisWithLayer: function(tableName, opts) {
    var self = this;
    this.changeToVisualization({
      success: function() {
        self.map.addCartodbLayerFromTable(tableName, opts);
      }
    });

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
    if(0) {
      var vis = new cdb.admin.Visualization({
        source_visualization_id: this.id
      });
      vis.save(null, {
        success: success,
        error: error
      });
      return;
    }

    // Clone object attributes
    var attrs = _.clone(this.attributes);
    delete attrs.id; // Remove vis id
    delete attrs.map_id;
    var vis = new cdb.admin.Visualization(attrs)

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
        }, {
          wait: true,
          success: function() {
            _map.saveLayers({
              success: function(r) {
                success && success(vis);
              },
              error: function(e) {
                error && error(e);
              }
            });
          },
          error: function(m, e) {
            error && error(e);
          }
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

          // If there isn't any changed attribute
          if (!self.changedAttributes()) { return false; }

          var attrs = _.pick(self.changedAttributes(), self.INHERIT_TABLE_ATTRIBUTES);

          layer.table.save(attrs, {
            wait: true,
            success: function(c) {
              // Check with real data
              // It prevents server changes due to, for example, encoding names
              var attrs_ = {};
              _.each(self.INHERIT_TABLE_ATTRIBUTES, function(attr){
                attrs_[attr] = c.get(attr);
              });

              self.save(attrs_);
            },
            error: function(e){
              self.error('error setting attributes', e);
              var attrs_ = {};
              var changed_attrs = self.previousAttributes();
              _.each(changed_attrs, function(value, attr){
                if (_.contains(self.INHERIT_TABLE_ATTRIBUTES, attr)) {
                  attrs_[attr] = value;
                }
              });

              self.set(attrs_);
            }
          });
        }
      })
    }
  },


  // PUBLIC FUNCTIONS

  embedURL: function() {
    return "/viz/" + this.get('name') + "/embed_map";
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

  _VISUALIZATIONS_PER_PAGE: 9,

  initialize: function() {

  console.log('collection', this);

    var default_options = new cdb.core.Model({
      tag_name  : "",
      q         : "",
      page      : 1,
      type      : "derived",
      per_page  : this._VISUALIZATIONS_PER_PAGE
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
      this.options.set({"page": total + 1});
    } else if (this.options.get("page") < 1) {
      this.options.set({"page": 1});
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
