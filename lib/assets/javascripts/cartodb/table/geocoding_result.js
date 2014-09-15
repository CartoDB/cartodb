
  /**
   *  Displays the result of a geocoding task
   *
   *  - Success (number of rows geocoded, cost, etc)
   *  - Failed 
   */


  cdb.admin.GeocodingResult = cdb.core.View.extend({

    _TEXTS: {

      error: {
        title:  _t("Georeference Error"),
        desc:   _t("There was a problem georeferencing your data. Please, get in contact with support to receive assistance.")
      },

      success: {
        title:  {
          empty: _t('No rows were georeferenced')    
        }
      },

      // TODO: Change location of these texts and re-think templates
      // TODO: Add multilanguage support

      paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%= remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%= price/100 %></strong> because <strong><%= used_credits %></strong> geocoding credit<%= used_credits == 1 ? '' : 's'  %> <%= used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p>",

      one_paid: "<% if (!success) { %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p><% } %>" + 
          "<p><% if (price == 0) { %>This job cost you <strong>$0</strong> because we love you! You have <strong><%= remaining_quota %></strong> geocoding tokens remaining in your free quota this month.<% } else { %>This job cost you <strong>$<%= price/100 %></strong> because <strong><%= used_credits %></strong> geocoding credit<%= used_credits == 1 ? '' : 's'  %> <%= used_credits == 1 ? 'was' : 'were'  %> over your freely available quota. This will be added to next months bill.<% } %></p>",

      zero_paid: "<p>Perhaps these rows contained empty values or perhaps we just didn't know what the values meant.</p><p>Unsuccessful rows don't count against your quota, so we encourage you to take a look and try again.</p>",

      free: "<% if (!success){ %><p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p><% } %><p>This job cost you <strong>$0</strong> because we love you for being you!</p>",

      zero_free: "<p>It seems that some of your rows didn't finish succesfully. Perhaps these rows contained empty values or perhaps we just didn't know what the values meant. We encourage you to take a look and try again.</p>"
    },


    initialize: function() {
      this.geocoder = this.options.geocoder;
      this._initBinds();
    },

    _initBinds: function() {
      this.geocoder.bind('geocodingError',    this._onGeocodingError, this);
      this.geocoder.bind('geocodingComplete', this._onGeocodingComplete, this);
      this.add_related_model(this.geocoder);
    },

    _onGeocodingError: function(msg, desc) {

      if (this.dlg) this.dlg.hide();

      var dlg = this.dlg = new cdb.admin.GeocodingMessageDialog({
        style: msg.geometry_type || "polygon",
        modal_type: "error",
        title: msg.title || this._TEXTS.error.title,
        description: msg.description || this._TEXTS.error.desc
      });

      dlg.appendToBody().open();
      dlg.animate();
    },

    _onGeocodingComplete: function(msg) {
      var title, description;
      var success = msg.real_rows > 0 && (msg.real_rows - msg.processable_rows) == 0;
      var pretty_real_rows = cdb.Utils.formatNumber(msg.real_rows);
      var pretty_processable_rows = cdb.Utils.formatNumber(msg.processable_rows);

      msg.success = success;

      if (msg.kind != "high-resolution") { // FREE

        if (success){

          title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

          if (msg.real_rows == 1) {
            description = _.template(this._TEXTS.free)(msg);
          } else {
            description = _.template(this._TEXTS.free)(msg);
          }

        } else if (msg.real_rows == 0) {
          title = this._TEXTS.success.title.empty;
          description = _.template(this._TEXTS.zero_free)(msg);
        } else {

          title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

          description = _.template(this._TEXTS.free)(msg);
        }

      } else {

        var row_count = msg.real_rows;
        title = (msg.real_rows == 1 ? "One" : pretty_real_rows) + " out of " + (msg.processable_rows == 1 ? "one" : pretty_processable_rows) + " row" + (msg.processable_rows == 1 ? " " : "s ") + (msg.processable_rows == 1 ? "was" : "were") + " succesfully turned into " + (msg.geometry_type || 'point') + "s!"

        if (success) {
          if (msg.real_rows == 1) {
            description = _.template(this._TEXTS.one_paid)(msg);
          } else {
            description = _.template(this._TEXTS.paid)(msg);
          }
        } else if (msg.real_rows == 0) {
          title = this._TEXTS.success.title.empty;
          description = _.template(this._TEXTS.zero_paid)(msg);
        } else {
          description = _.template(this._TEXTS.paid)(msg);
        }
      }

      if (this.dlg) this.dlg.hide();

      var dlg = this.dlg = new cdb.admin.GeocodingMessageDialog({
        style: msg.geometry_type,
        modal_type: "notification",
        title: title,
        description: description
      });

      dlg.appendToBody().open();
      dlg.animate();
    }

  });