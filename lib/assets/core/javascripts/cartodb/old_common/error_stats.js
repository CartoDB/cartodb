
/**
 *  Class for javascript errors in CartoDB App
 *
 *  - It controls JS errors and save them into the
 *    service we set at the begining.
 */

cdb.admin.ErrorStats = cdb.core.Model.extend({

  defaults: {
    name:        'trackJs',              // Name of the service
    people:      'configure',            // Internal service function for setting people configuration
    template:    'old_common/views/trackjs', // Template for setting people configuration
    enable_logs: false                   // Sends the errors to the logger
  },

  initialize: function(opts) {
    if (opts && opts.user_data) {
      this.user_data = opts.user_data;  
    }

    if (window[this.get('name')]) {
      this._setService();
    }
  },

  _setService: function() {
    // Set people?
    if (this.get('people') && this.user_data) {
      var template = cdb.templates.getTemplate(this.get('template'));
      window[this.get('name')][this.get('people')](JSON.parse(template(this.user_data)));
    }
    // Save logs?
    if (this.get('enable_logs')) {
      cdb.log = window[this.get('name')];
    }
  }

});
