
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

    defaults: {
      kind: '',
      formatter: '',
      table_name: ''
    },

    georeference_messages: {


      paid: "<p><%= real_rows %> out of <%= processable_rows %> rows were succesfully turned into <%= geometry_type || 'polygon' %>s!</p>" +
          "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p>This job cost you $0 because we love you! You have XXX geocoding tokens remaining in your free quota this month.</p>",

      one_paid: "<p>One row was succesfully turned into <%= geometry_type || 'polygon' %>s!</p>" +
          "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p>This job cost you $0 because we love you! You have XXX geocoding tokens remaining in your free quota this month.</p>",

      zero_paid: "<p>No rows were geocoded. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant.</p><p>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p>",

      free: "<p><%= real_rows %> out of <%= processable_rows %> rows were succesfully turned into <%= geometry_type || 'polygon' %>s!</p> <p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p><p>This job cost you $0 because we love you for being you!</p>",

      zero_free: "<p>No rows were geocoded</p><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p>"

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
      }, i || 1500);
    },

    destroyCheck: function() {
      clearInterval(this.pollTimer);
    },

    _checkFinish: function() {
      var state = this.get('state');

      var attributes = _.clone(this.attributes);

      if (state === null) {
        this.trigger('geocodingStarted', this);
      } else if (state === "finished") {
        this.destroyCheck();
        this.clear({ silent: true });
        this.trigger('geocodingComplete', attributes, this);

        this._onGeocodingComplete(attributes);

      } else if (state === "failed") {
        var error = this.attributes.error;
        this.destroyCheck();
        this.clear({ silent: true });
        this.trigger('geocodingError', error, this);

        this._onGeocodingError(error);

      } else if (state === "reset" || state === "cancelled") {
        this.clear({ silent: true });
      } else {
        this.trigger('geocodingChange', this);
      }
    },

  _onGeocodingComplete: function(msg) {

    //this.options.table.trigger("notice", "Table georeferenced");

    var description;
    var success = msg.real_rows > 0 && (msg.real_rows - msg.processable_rows) == 0;

    msg.success = success;

    if (msg.kind != "high-resolution") { // FREE

      if (success){

        if (msg.real_rows == 1) {
          description = _.template(this.georeference_messages.one_free)(msg);
        } else {
          description = _.template(this.georeference_messages.free)(msg);
        }

      } else if (msg.real_rows == 0) {
        description = _.template(this.georeference_messages.zero_free)(msg);
      }

    } else {

      if (success) {

        if (msg.real_rows == 1) {
          description = _.template(this.georeference_messages.one_paid)(msg);
        } else {
          description = _.template(this.georeference_messages.paid)(msg);
        }
        
      } else if (msg.real_rows == 0) {
        description = _.template(this.georeference_messages.zero_paid)(msg);
      }
    }

    var dlg = new cdb.admin.GeocoderMessageDialog({
      style: msg.geometry_type,
      modal_type: "notification",
      title: msg.real_rows + " row" + (msg.real_rows == 1 ? "" : "s") + " were georeferenced",
      description: description
    });

    dlg.appendToBody().open();
    dlg.animate();


  },

  _onGeocodingError: function(msg) {

    var dlg = new cdb.admin.GeocoderMessageDialog({
      style: msg.geometry_type || "polygon",
      modal_type: "error",
      title: "Georeference Error",
      description: "There was a problem georeferencing your data. Please, get in contact with support to receive assistance.",
    });

    dlg.appendToBody().open();
    dlg.animate();

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

    url: '/api/v1/geocodings'

  });
