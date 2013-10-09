

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
    }

  });