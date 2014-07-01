
  /**
   *  Model to poll the number of users who are
   *  editing the current visualization at the 
   *  same time.
   *
   *  - It needs a visualization model.
   *
   */


  cdb.admin.WatchingNotifierModel = cdb.core.Model.extend({

    _INTERVAL: 15000, // in miliseconds

    defaults: {
      users: []
    },

    url: function() {
      return '/api/v1/viz/' + this.vis.get('id') + '/watching'
    },

    initialize: function(attrs, opts) {
      // If there is no vis defined :() -> HORROR!
      if (!opts.vis) {
        cdb.log.info('There is no vis defined')
      }

      this.vis = opts.vis;

      this._initBinds();
      this._checkPermissions();
    },

    _initBinds: function() {
      this.vis.bind('change:id', this._checkPermissions, this);
    },

    parse: function(r) {
      return { users: r }
    },

    _checkPermissions: function() {
      if (this.vis.permission) {
        var perm = this.vis.permission;

        if (perm.acl.size() > 0) {
          this.pollCheck();
        } else {
          this.destroyCheck();
        }
      } else {
        this.destroyCheck();
      }
    },

    /**
     * checks for poll to check
     */
    pollCheck: function(i) {
      var self = this;
      var tries = 0;
      
      this.pollTimer = setInterval(function() {
        self.fetch({
          error: function(e) {
            self.trigger("change");
          }
        });
        ++tries;
      }, i || this._INTERVAL );
    },

    destroyCheck: function() {
      clearInterval(this.pollTimer);
      this.set('users', []);
    }

  });