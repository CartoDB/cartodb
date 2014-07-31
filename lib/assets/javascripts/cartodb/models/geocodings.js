
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

      paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%= remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%= price/100 %></strong> because <strong><%= used_credits %></strong> geocoding credit<%= used_credits == 1 ? '' : 's'  %> <%= used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p>",

      one_paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%= remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%= price/100 %></strong> because <strong><%= used_credits %></strong> geocoding credit<%= used_credits == 1 ? '' : 's'  %> <%= used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p>",

      zero_paid: "<p>Perhaps these rows contained empty values or perhaps we just didn't know what the values meant.</p><p>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p>",

      free: "<% if (!success){ %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p><% } %><p>This job cost you <strong>$0</strong> because we love you for being you!</p>",

      zero_free: "<p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p>"

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
      var error = this.get('error');

      var attributes = _.clone(this.attributes);

      if (state === null) {
        this.trigger('geocodingStarted', this);
      } else if (state === "finished") {
        this.destroyCheck();
        this.clear({ silent: true });
        this.trigger('geocodingComplete', attributes, this);

        this._onGeocodingComplete(attributes);

      } else if (state === "failed") {
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

    var title, description;
    var success = msg.real_rows > 0 && (msg.real_rows - msg.processable_rows) == 0;
    var pretty_real_rows = cdb.Utils.formatNumber(msg.real_rows);
    var pretty_processable_rows = cdb.Utils.formatNumber(msg.processable_rows);

    msg.success = success;

    if (msg.kind != "high-resolution") { // FREE

      if (success){

          title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

        if (msg.real_rows == 1) {
          description = _.template(this.georeference_messages.free)(msg);
        } else {
          description = _.template(this.georeference_messages.free)(msg);
        }

      } else if (msg.real_rows == 0) {
        title = "No rows were georeferenced"
        description = _.template(this.georeference_messages.zero_free)(msg);
      } else {

          title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

        description = _.template(this.georeference_messages.free)(msg);
      }

    } else {

      var row_count = msg.real_rows;
      title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

      if (success) {

        if (msg.real_rows == 1) {
          description = _.template(this.georeference_messages.one_paid)(msg);
        } else {
          description = _.template(this.georeference_messages.paid)(msg);
        }
        
      } else if (msg.real_rows == 0) {

        title = "No rows were georeferenced"
        description = _.template(this.georeference_messages.zero_paid)(msg);

      } else {
        description = _.template(this.georeference_messages.paid)(msg);
      }
    }

    // TODO: move this behaviour to a view, not in a model please
    if (this.dlg) this.dlg.hide();

    var dlg = this.dlg = new cdb.admin.GeocoderMessageDialog({
      style: msg.geometry_type,
      modal_type: "notification",
      title: title,
      description: description
    });

    dlg.appendToBody().open();
    dlg.animate();


  },

  _onGeocodingError: function(msg, desc) {

    // TODO: move this behaviour to a view, not in a model please

    if (this.dlg) this.dlg.hide();

    var dlg = this.dlg = new cdb.admin.GeocoderMessageDialog({
      style: msg.geometry_type || "polygon",
      modal_type: "error",
      title: "Georeference Error",
      description: desc || "There was a problem georeferencing your data. Please, get in contact with support to receive assistance.",
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
