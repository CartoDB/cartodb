
  /**
   *  Model to poll the number of users who are
   *  editing the current visualization at the 
   *  same time.
   *
   *  - It needs a visualization model.
   *
   */


  cdb.admin.WatchingNotifierModel = cdb.core.Model.extend({

    _INTERVAL: 30000, // in milliseconds
    _FIRST_TRY: 3000, // in milliseconds

    defaults: {
      users: []
    },

    url: function(method) {
      var version = cdb.config.urlVersion('watching', method);
      return '/api/' + version + '/viz/' + this.vis.get('id') + '/watching'
    },

    initialize: function(attrs, opts) {
      // If there is no vis defined :() -> HORROR!
      if (!opts.vis) {
        cdb.log.info('There is no vis defined')
      }

      // Interval change?
      if (opts.interval) {
        this._INTERVAL = (opts.interval/2) * 1000;
      }

      this.vis = opts.vis;
      this.set('id', this.vis.get('id'));

      this._initBinds();
      this._checkPermissions();
    },

    _initBinds: function() {
      _.bindAll(this, '_fetchModel');
      this.vis.bind('change:id', this._checkPermissions, this);
    },

    _checkPermissions: function() {
      var self = this;

      if (this.vis.permission && !this.vis.isVisualization()) {
        var perm = this.vis.permission;

        if (perm.acl.size() > 0) {
          setTimeout(function() {
            self._fetchModel()
            self.pollCheck();
          }, self._FIRST_TRY);
        } else {
          this.destroyCheck();
        }
      } else {
        this.destroyCheck();
      }
    },

    _fetchModel: function() {
      var self = this;
      this.save({
        success: function() {
          self.trigger('change');
        },
        error: function(e) {
          self.destroyCheck();
        }
      });
    },

    /**
     * checks for poll to check
     */
    pollCheck: function(i) {
      var self = this;
      
      this.pollTimer = setInterval(function() {
        self._fetchModel();
      }, i || this._INTERVAL );
    },

    destroyCheck: function() {
      clearInterval(this.pollTimer);
      this.set('users', []);
    },

    // Parse users result
    parse: function(r) {
      return { users: r }
    }

  });
