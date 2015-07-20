
  /**
   *  Geocoding endpoint by id
   *
   *  - State property could be:
   *
   *    · null -> it haven't started
   *    · started -> it has just started
   *    · submitted -> it has sent to the geocoder service
   *    · completed -> geocoder service has finished
   *    · finished -> Our database has finished, process completed
   *
   */


  cdb.admin.Geocoding = cdb.core.Model.extend({

    _POLLTIMER: 2000,

    defaults: {
      kind: '',
      formatter: '',
      table_name: ''
    },

    idAttribute: 'id',

    url: function(method) {
      var version = cdb.config.urlVersion('geocoding', method);

      var base = '/api/' + version + '/geocodings/';
      if (this.isNew()) {
        return base;
      }
      return base + this.id;
    },

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
      }, i || this._POLLTIMER);
    },

    destroyCheck: function() {
      clearInterval(this.pollTimer);
    },

    _checkFinish: function() {
      var state = this.get('state');
      var error = this.get('error');

      var attributes = _.clone(this.attributes);

      if (state === null) {
        this.trigger('geocodingStarted', this);
      } else if (state === "finished") {
        this.destroyCheck();
        this.clear({ silent: true });
        this.trigger('geocodingComplete', attributes, this);
      } else if (state === "failed") {
        this.destroyCheck();
        this.clear({ silent: true });
        this.trigger('geocodingError', error, this);
      } else if (state === "reset" || state === "cancelled") {
        this.clear({ silent: true });
      } else {
        this.trigger('geocodingChange', this);
      }
    },

    cancelGeocoding: function() {
      this.destroyCheck();
      this.trigger('geocodingCanceled', this);
      this.save({ state:'cancelled' }, { wait:true });
    },

    resetGeocoding: function() {
      this.destroyCheck();
      this.trigger('geocodingReset', this);
      this.set('state', 'reset');
    },

    isGeocoding: function() {
      return this.get('id') && this.get('table_name') && (this.get('formatter') || this.get('kind'))
    }

  });


  /**
   *  Geocoding endpoint to get all running geocodings
   *
   */

  cdb.admin.Geocodings = cdb.core.Model.extend({

    url: function(method) {
      var version = cdb.config.urlVersion('geocoding', method);

      return '/api/' + version + '/geocodings';
    }

  });

  /**
   * Model to get available geometries from a location (column_name from table or free_text)
   *
   * TODO: Extracted from cdb.admin.GeocodingDialog.AvailableGeometries, but should probably be merged with the
   *   Geocodings model above. But how?
   */
  cdb.admin.Geocodings.AvailableGeometries = cdb.core.Model.extend({

    url: function(method) {
      var version = cdb.config.urlVersion('geocoding', method);
      return '/api/' + version + '/geocodings/available_geometries';
    },

    parse: function(r) {
      return { available_geometries: r }
    }

  });

  /**
   *  Geocoding estimation for a table
   *
   *  - It will show the estimate price of geocoding that table.
   *
   */
  cdb.admin.Geocodings.Estimation = cdb.core.Model.extend({

    // defaults: {
    //   rows:       0,
    //   estimation: 0 - actually the cost (in credits)
    // },

    urlRoot: function() {
      var version = cdb.config.urlVersion('geocoding', 'read');
      return "/api/" + version + "/geocodings/estimation_for/";
    },

    reset: function() {
      this.unset('rows');
      this.unset('estimation');
    },

    costInCredits: function() {
      return this.get('estimation');
    },

    mayHaveCost: function() {
      // also includes undefined, for the case when the price is unknown)
      return this.costInCredits() !== 0;
    },

    costInDollars: function() {
      return Math.ceil(this.costInCredits() / 100);
    }


  });
