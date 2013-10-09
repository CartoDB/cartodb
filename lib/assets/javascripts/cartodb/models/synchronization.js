

  /**
   *  Synced table model
   */

  cdb.admin.TableSynchronization = cdb.core.Model.extend({

    urlRoot: '/api/v1/synchronizations',

    defaults: {
      name: '',
      url: '',
      state: '', // success, failure, synchronization,...
      run_at: 0, // int
      runned_at: 0, // date
      retried_times: 0, // int
      interval: 0 // seg
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
