

  /**
   *  Geocoder user stats
   *
   *  - It needs user model to show the geocoding stats
   *    of the user and the table model to know total rows.
   *  - CartoDB config object is needed.
   *
   *  new cdb.admin.GeocoderStats({
   *    model: user_model,
   *    table: table_model
   *  })
   *
   */


  cdb.admin.GeocoderStats = cdb.core.View.extend({

    tagName: 'div',
    className: 'geocoder_stats',

    _TEXTS: {
      available_hard: _t('You have <strong><%= quota - monthly_use %> geocoding credit<%= quota - monthly_use > 1 ? "s" : "" %> available</strong>. Depending on your data you might run out of credits, if so consider <a href="<%= upgrade_url %>?utm_source=Georeferencing_Credits_Remaining&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20to%20a%20higher%20plan">upgrading to a higher plan</a>.'),
      available_soft: _t('You have <strong><%= quota - monthly_use %> geocoding credit<%= quota - monthly_use > 1 ? "s" : "" %> available</strong>. Depending on your data you might run out of credits and you will be charged $<%= block_price %>/1,000 extra geocoding credits.'),
      no_rows_available: _t('You don\'t have more geocoding credits this month. <strong>From now on you will be charged $<%= block_price %>/1,000 rows</strong>.'),
      no_rows_upgrade: _t('You don\'t have more geocoding credits this month. <a href="<%= upgrade_url %>?utm_source=Georeferencing_Credits_Not_Enough&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=Upgrade%20your%20account">Upgrade your account</a> to get more.'),
      // warning: _t("<strong>New rows added to this table will be geocoded automatically.</strong>")
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate("table/header/views/geocoder_stats");
      this.model.bind('change:geocoding', this.render, this);
    },

    render: function() {
      var config = window.config;
      var geocoding = _.clone(this.model.get('geocoding')),
          msg = '',
          state = '',
          url = window.location.protocol + '//' + config.account_host + "/account/" + this.model.get('username') + "/upgrade",
          used = (((geocoding.monthly_use || 0) * 100) / geocoding.quota);

      // Msg
      geocoding.upgrade_url = url;
      geocoding.block_price = ((geocoding.block_price || 1) / 100);
      msg = this._getMessage(geocoding);

      // Progress state
      if (used > 80 && used < 100) {
        state = 'warning';
      } else if (used >= 100) {
        state = 'danger';
      }

      var obj = {
        msg:          msg,
        upgrade_url:  url,
        state:        state,
        used:         used
      }

      this.$el.html(this.template(obj))

      return this;
    },

    _getMessage: function(obj) {
      var msg = '';
      var used = (((obj.monthly_use || 0) * 100) / obj.quota);
      var available = Math.max((obj.quota - obj.monthly_use),0);

      if (used < 100) {
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'available_hard' : 'available_soft' ])(obj);
      } else {
        // Limits reached
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'no_rows_upgrade' : 'no_rows_available' ])(obj);
      }

      // if (!obj.hard_limit || used < 100) { // Add geocoding warning
      //   msg += " " + this._TEXTS["warning"];
      // }

      return msg;
    }

  })
