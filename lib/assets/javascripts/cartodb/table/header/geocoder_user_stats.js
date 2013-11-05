

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
      rows_available: _t('<strong><%= quota - monthly_use %> row<%= quota - monthly_use > 1 ? "s" : "" %> available</strong> under your plan this month.'),
      not_enough_hard: _t('Not enough free geocodes for this table. <strong>Only <%= quota - monthly_use %> row<%= quota - monthly_use > 1 ? "s" : "" %> will be geocoded</strong>.'),
      not_enough_soft: _t('You don\'t have enough geocoding credits to geocode the entire table this month. <strong>From now on you will be charged $<%= block_price %>/1,000 rows</strong>.'),
      no_rows_available: _t('You don\'t have more geocoding credits this month. <strong>From now on you will be charged $<%= block_price %> per 1,000 rows</strong>.'),
      no_rows_upgrade: _t('You don\'t have more geocoding credits this month. <a href="<%= upgrade_url %>">Upgrade your account</a> to get more.')
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate("table/header/views/geocoder_stats");
      this.model.bind('change:geocoding', this.render, this);
    },

    render: function() {
      var config = window.config;
      var geocoding = this.model.get('geocoding'),
          msg = '',
          state = '',
          need = false,
          url = window.location.protocol + '//' + config.account_host + "/account/" + this.model.get('username') + "/upgrade",
          used = (((geocoding.monthly_use || 0) * 100) / geocoding.quota);

      // Msg
      geocoding.upgrade_url = url;
      msg = this._getMessage(geocoding);

      // Need link?
      if (used < 100 && geocoding.hard_limit) {
        need = true
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
    },

    _getMessage: function(obj) {
      var msg = '';
      var used = (((obj.monthly_use || 0) * 100) / obj.quota);
      var available = Math.max((obj.quota - obj.monthly_use),0);
      var table_rows = this.options.table.get('rows_counted') || 0;
      var enough = available > table_rows;

      if (used < 100 && enough) {
        msg = _.template(this._TEXTS.rows_available)(obj);
      } else if (used < 100 && !enough) {
        // Not enough rows to georeference under user plan
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'not_enough_hard' : 'not_enough_soft' ])(obj);
      } else {
        // Limits reached
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'no_rows_upgrade' : 'no_rows_available' ])(obj); 
      }

      return msg;
    }

  })