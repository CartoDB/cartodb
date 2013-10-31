// [10/31/13 4:56:29 PM] demimismo: null => no se ha empezado
// [10/31/13 4:56:40 PM] demimismo: started => se acaba de empezar
// [10/31/13 4:56:45 PM] demimismo: submitted => enviado a nokia
// [10/31/13 4:56:54 PM] demimismo: completed => nokia ha terminado
// [10/31/13 4:57:05 PM] demimismo: finished => datos cargados, todo terminado




  /**
   *
   */


  cdb.admin.Geocoding = cdb.core.Model.extend({

    defaults: {
      id: ''
    },

    idAttribute: 'id',
    
    urlRoot: '/api/v1/geocodings',

    initialize: function() {
      this.bind('change', this._checkFinish, this);
    },

    setUrlRoot: function(urlRoot) {
      this.urlRoot = urlRoot;
    },

    /**
     * checks for poll to finish
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
      }, i || 2000);
    },

    destroyCheck: function() {
      clearInterval(this.pollTimer);
    },

    _checkFinish: function() {
      var state = this.get('state');
      
      if (state === null) {
        this.trigger('geocodingStarted', this);
      } else if (state === "finished") {
        clearInterval(this.pollTimer);
        this.trigger('geocodingComplete', this);
      } else if (this.get('state') === "failed") {
        clearInterval(this.pollTimer);
        this.trigger('geocodingError', this);
      } else {
        this.trigger('geocodingChange', this);
      }
    },

    isGeocoding: function() {
      return this.get('id') && this.get('table_name') && this.get('formatter')
    }
  });


  /**
   *
   */

  cdb.admin.Geocodings = cdb.core.Model.extend({
    
    url: '/api/v1/geocodings'

  });
