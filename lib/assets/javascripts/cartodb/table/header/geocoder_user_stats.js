

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


cdb.admin.GeoreferenceEstimation = cdb.core.Model.extend();

cdb.admin.GeoreferenceEstimations = Backbone.Collection.extend({
  model:cdb.admin.GeoreferenceEstimation,
  url: function(method) {
    var version = cdb.config.urlVersion('geocoding', method);
    return "/api/" + version + "/geocodings/estimation_for/",
  },
  initialize: function(model, options) {
    this.url = this.url + options.table_name;
  }
});

  cdb.admin.GeocoderStats = cdb.core.View.extend({

    tagName: 'div',
    className: 'geocoder_stats',

    _TEXTS: {

      upgrade_account: _t('<p><a href="<%- upgrade_url %><%- upgrade_url_no_rows_params %>">Upgrade your account</a> to get more.</p>'),

      charged: _t('<p>$<%- block_price %>/1,000 rows will be charged</p>'),

      available_hard: _t('<p><%- credits %> geocoding credit<%- credits > 1 ? "s" : "" %> still available.</p>' +
                         '<% if (cost && cost > 0) { %><p>We calculate that geocoding this table completely could cost you up to <strong class="cost">$<%- cost %></strong>.</p><% } %>'),

      available_soft: _t('<p><%- credits %> geocoding credit<%- credits > 1 ? "s" : "" %> still available.</p>' +
                         '<% if (cost && cost > 0) { %><p>We calculate that geocoding this table completely could cost you up to <strong class="cost">$<%- cost %></strong>.</p><% } %>'),

      no_geocodings_available: _t('<p>You don\'t have more geocoding credits this month.</p>'),

      no_geocodings_available_cost: _t('<p>You don\'t have more geocoding credits this month.</p>' +
                                       '<% if (cost && cost > 0) { %><p>We calculate that geocoding this table completely could cost you up to <strong class="cost">$<%- cost %></strong>.</p><% } %>')

    },

    initialize: function() {

      var self = this;

      this.template = cdb.templates.getTemplate("table/header/views/geocoder/geocoder_stats");
      this.model.bind('change:geocoding', this.render, this);

      this.estimations = new cdb.admin.GeoreferenceEstimations([], {
        table_name: this.options.table.get('id')
      });

      this.estimations.fetch({ success : function(res) {
        self.cost = res.models[0].get("estimation")/100;
        self.render();
      }});

    },

    render: function() {

      var config    = window.config;
      var geocoding = _.clone(this.model.get('geocoding'));

      // test
      //geocoding.monthly_use = Math.round(Math.random(100) * 100);
      //geocoding.quota = 10;

      var  msg  = '',
      state     = '',
      url       = window.location.protocol + '//' + config.account_host + "/account/" + this.model.get('username') + "/upgrade",
      used      = geocoding.quota ? (((geocoding.monthly_use || 0) * 100) / geocoding.quota) : 100;

      // Msg
      geocoding.upgrade_url = url;
      geocoding.upgrade_url_no_rows_params = "?utm_source=Georeferencing_Credits_Not_Enough&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=Upgrade%20your%20account";
      geocoding.upgrade_url_hard_params    = "?utm_source=Georeferencing_Credits_Remaining&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20to%20a%20higher%20plan";

      geocoding.block_price = ((geocoding.block_price || 1) / 100);

      msg = this._getMessage(geocoding);

      // Progress state
      if (used > 80 && used < 100) {
        state = 'warning';
      } else if (used >= 100) {
        state = 'danger';
      }

      var obj = {
        msg:          msg.msg,
        after_msg:    msg.after_msg,
        upgrade_url:  url,
        state:        state,
        used:         used
      }

      this.$el.html(this.template(obj))

      return this;
    },

    _getMessage: function(obj) {

      var msg = '', after_msg = '';
      var used      = obj.quota ? (((obj.monthly_use || 0) * 100) / obj.quota) : 100;
      var available = Math.max((obj.quota - obj.monthly_use), 0);

      obj.credits = obj.quota - obj.monthly_use;
      obj.cost = this.cost || 0;

      if (used < 100) {
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'available_hard' : 'available_soft' ])(obj);

        if (obj.cost && obj.cost > 0) {
          after_msg = _.template(this._TEXTS[ "charged" ])(obj);
        }

      } else {
        // Limits reached
        msg = _.template(this._TEXTS[ obj.hard_limit ? 'no_geocodings_available' : 'no_geocodings_available_cost' ])(obj);
        after_msg = _.template(this._TEXTS[ obj.hard_limit ? 'upgrade_account' : 'charged' ])(obj);
      }

      return { msg: msg, after_msg: after_msg }
    }

  })
