

  /**
   *  Synced table model
   */

  cdb.admin.TableSynchronization = cdb.core.Model.extend({

    defaults: {
      name: '',
      url: '',
      state: '', // success, failure, synchronization,...
      run_at: 0, // int
      runned_at: 0, // date
      retried_times: 0, // int
      interval: 0 // seg
    }

  });