

  /**
   *  Synced table model
   */

  cdb.admin.TableSynchronization = cdb.core.Model.extend({

    _STATES: ['created', 'failure', 'success', 'syncing'],

    urlRoot: '/api/v1/synchronizations',

    defaults: {
      name: '',
      url: '',
      state: '',
      run_at: 0,
      ran_at: 0,
      retried_times: 0,
      interval: 0,
      error_code: 0,
      error_message: ''
    },

    initialize: function() {
      this.bind('destroy', function() {
        this.unset('id');
      });
    },

    toJSON: function() {
      var c = _.clone(this.attributes);

      var d = {
        url:      c.url,
        interval: c.interval
      };

      if(c.id !== undefined) {
        d.id = c.id;
      }
      return d;
    },

    isSync: function() {
      return !this.isNew();
    },

    linkToTable: function(table) {
      var self = this;
      if (table.has('synchronization')) {
        this.set(table.get('synchronization'));
      }

      table.bind('change:synchronization', function() {
        self.set(table.get('synchronization'));
      }, table);

      table.bind('destroy', function destroy() {
        self.unbind(null, null, table);
        self.destroy();
      }, table);
      //TODO: manage table renaming
    }

  });
