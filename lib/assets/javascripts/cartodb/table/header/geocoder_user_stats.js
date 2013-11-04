

  /**
   *  Geocoder user stats
   *
   *  - It needs user model to show the geocoding stats
   *    of the user.
   *  - CartoDB config object is needed.
   *
   *  new cdb.admin.GeocoderStats({
   *    model: user_model
   *  })
   *
   */


  cdb.admin.GeocoderStats = cdb.core.View.extend({

    tagName: 'div',
    className: 'geocoder_stats',

    _TEXTS: {
      rows_available: _t('<strong><%= quota - monthly_use %> rows available</strong> under your plan this month.'),
      no_rows_available: _t('No rows available under your plan this month. <strong>$<%= block_price %>/1,000 rows will be charged</strong>.'),
      no_rows_upgrade: _t('No rows available under your plan this month. <a href="<%= upgrade_url %>">Upgrade your account</a> to get more.')
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate("table/header/views/geocoder_stats");
      this.model.bind('change:geocoding', this.render, this)
    },

    render: function() {
      var geocoding = this.model.get('geocoding'),
          msg = '',
          state = '',
          need = false,
          url = window.location.protocol + '//' + config.account_host + "/account/" + this.model.get('username') + "/upgrade",
          used = (((geocoding.monthly_use || 0) * 100) / geocoding.quota);


      // Msg
      if (used < 100) {
        msg = _.template(this._TEXTS.rows_available)(geocoding);
        need = true;
      } else if (geocoding.hard_limit) {
        msg = _.template(this._TEXTS.no_rows_upgrade)({ upgrade_url: url });
      } else {
        msg = _.template(this._TEXTS.no_rows_available)(geocoding);
      }

      // Progress state
      if (used > 80 && used < 100) {
        state = 'warning';
      } else if (used >= 100) {
        state = 'danger';
      }

      var obj = {
        msg:          msg,
        need:         need,
        upgrade_url:  url,
        state:        state,
        used:         used
      }

      this.$el.html(this.template(obj))

      return this;
    }

  })