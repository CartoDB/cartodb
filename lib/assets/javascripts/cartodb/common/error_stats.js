
  /**
   *  Class for javascript errors in CartoDB App
   * 
   *  - It controls JS errors and save them into the
   *    service we set at the begining.
   */

  cdb.admin.ErrorStats = cdb.core.Model.extend({

    defaults: {
      name:     'Rollbar',              // Name of the service
      people:   'configure',            // Internal service function for setting people configuration
      template: 'common/views/rollbar', // Template for setting people configuration
      logs:     true                    // Move log errors to the service
    },

    initialize: function(opts) {
      this.user_data = opts.user_data;
      if (window[this.get('name')]) {
        this._setService();
      }
    },

    _setService: function() {
      // Set people
      if (this.get('people')) {
        var template = cdb.templates.getTemplate(this.get('template'));
        window[this.get('name')][this.get('people')](JSON.parse(template(this.user_data)));
      }
      
      // Set logs
      if (this.get('logs')) {
        cdb.log = window[this.get('name')];  
      }
    }

  });