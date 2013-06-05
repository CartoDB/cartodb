/**
* User stats embeded in the dashboard
*
* It shows the tables and the space used in the user account
* You must set the username, the user id and the tables model,
* if not, it won't work.
*
* Usage example:
*
*  var userStats = new cdb.admin.dashboard.UserStats({
*    el: $('div.subheader'),
*    model: this.user**
*  })
*
*  **  It needs a user model to work properly.
*
*/

cdb.admin.dashboard.UserStats = cdb.core.View.extend({

  defaults: {
    loaded: false
  },

  events: {
    'click section.warning a.close':  '_disableWarning'
  },

  initialize: function() {

    if (!this.options.user_stats) this.options.user_stats = "";

    this.template = cdb.templates.getTemplate('dashboard/views/user_stats');

    // Control messages with LocalStorage
    // - Limit message ->       'limit'       -> Expire with the session

    // Recently upgraded message is under control thanks to a central request
    // - Upgraded message ->    'upgraded'    -> It doesn't expire, comes from server

    // Init localStorage
    this.localStorage = new cdb.admin.localStorage('cartodb_user_stats');

    // Any change, render this view
    this.model.bind('change', this.render, this);

    // Check if the user has upgraded his account
    this._checkUpgradedUser();
  },

  render: function() {

    this.$el.html(this.template(_.extend(this.model.toJSON(), this.options)));

    this._calculateQuotas();

    // If there is no tables in this account, activate or desactivate
    if (this.model.get("table_count") > 0) {
      this._activate();
    } else {
      this._desactivate();
    }

    // If user is dedicated, show support block
    if (this.model.get("dedicated_support")) {
      this._showDedicatedSupport();
    } else {
      this._hideDedicatedSupport();
    }

    if(this.model.get("table_quota") === null ) {
      this.$('.progress').addClass('unlimited')
    }

    // Rendering for the first time?
    if (!this.options.loaded) {
      this.options.loaded = !this.options.loaded;
    }

    this._updateGraphs();

    // Check and set user limits and upgraded account change
    this._setWarning();

    return this;
  },

  /**
  *  Manage how and when we should show any warning message
  */
  _setWarning: function() {
    // Check if this is a custom CartoDB install,
    // then if the user has upgraded his account (central service)
    // if not, check if there is danger with the space of
    // tables number (LocalStorage) and finally, if not, show the
    // cartodb20 message (LocalStorage).
    if (config && !config.custom_com_hosted) {
      if (this.recently_upgraded) {
        this._showWarning('upgraded');
        this.warning_type = "upgraded";

      } else if (!this.localStorage.get('limit') && ((this.model.get('byte_quota_status') != "" || this.model.get('table_quota_status') != "")
        && this.model.get("table_quota") != null && this.model.get("byte_quota") != null)) {
          this._showWarning('limit');
          this.warning_type = "limit";

        } else {
          this._hideWarning();
        }
    }
  },

  /**
  *  Check if the user has recently upgraded his account
  */
  _checkUpgradedUser: function() {
    // After know if the user has recently upgraded his account,
    // then render the stats
    if (config && !config.custom_com_hosted && config.account_host) {
      var self = this;
      $.ajax({
        url: '//' + config.account_host + '/account/' + this.model.get('username') + '/recently_upgraded',
        timeout: 5000,
        dataType: 'jsonp',
        success: function(r) {
          self.recently_upgraded = r.recently_upgraded;
          self._setWarning();
        },
        error: function(e) {
          self._setWarning();
        }
      });
    }
  },

  /*
  * Calculate user quotas status
  */
  _calculateQuotas: function() {

    var attrs = this.model.toJSON();

    attrs.table_quota_status    = this._calculateTableQuota(attrs);
    attrs.byte_quota_status     = this._calculateSpaceQuota(attrs);
    attrs.mapviews_quota_status = this._calculateMapViewsQuota(attrs);

    this.model.attributes = attrs;
  },

  _calculateTableQuota: function(attrs) {

    if (attrs.table_quota == null || attrs.table_quota == 0) return "green";

    var p = (attrs.table_count / attrs.table_quota * 100);

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";

  },

  _calculateSpaceQuota: function(attrs) {

    if (attrs.byte_quota == null || attrs.byte_quota == 0) return "green";

    var p = ((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100;

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";

  },

  _calculateMapViewsQuota: function(attrs) {

    if (attrs.api_calls_quota == null || attrs.api_calls_quota == 0) return "green";

    var sum = this._calcTotalMapViews();
    var p   = this._calcMapViewsPercentage(sum);

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";
  },

  _updateGraphs: function() {

    var attrs     = this.model.toJSON(), width = 4,  text = "";

    var $tables   = this.$el.find("section.stats .tables");
    var $space    = this.$el.find("section.stats .size");
    var $mapviews = this.$el.find("section.stats .mapviews");

    // Tables change
    // - Check if user has unlimited tables quota
    if (attrs.table_quota == null || attrs.table_quota == 0) {
      width = 100;
      text = "<strong>" + attrs.table_count + " of ∞</strong> tables created";
    } else {
      width = ((attrs.table_count / attrs.table_quota) * 100);
      text = "<strong>" + attrs.table_count + " of " + attrs.table_quota + "</strong> tables created";
    }

    $tables.find("p").html(text);
    $tables.find("div.progress span")
    .removeAttr("class").addClass(attrs.table_quota_status)
    .animate({
      width: width + "%"
    }, 500);


    // Space change
    // - Check if user has unlimited size quota

    var space_stats = {};

    if (attrs.byte_quota == null || attrs.byte_quota == 0) {
      space_stats.total = "∞";
    } else {
      space_stats = this._bytesToSize(attrs.byte_quota, (attrs.byte_quota - attrs.remaining_byte_quota));
    }

    if (attrs.byte_quota == null || attrs.byte_quota == 0) {
      width = 100;
      text = "You have <strong>" + space_stats.total + " space</strong>";
    } else {
      width = (( space_stats.used / space_stats.total) * 100);
      text = "<strong>" + space_stats.used + " of " + space_stats.total + "</strong> used " + space_stats.size;
    }

    $space.find("p").html(text);
    $space.find("div.progress span")
    .removeAttr("class").addClass(attrs.byte_quota_status)
    .animate({
      width: width + "%"
    }, 500);


    // Mapviews
    var sum = this._calcTotalMapViews();
    width   = this._calcMapViewsPercentage(sum);

    text = '<strong>' + this._formatNumber(sum) + '</strong> map views the last 30 days';
    $mapviews.find("p").html(text);
    $mapviews.find("div.progress span")
    .removeAttr("class").addClass(attrs.mapviews_quota_status)
    .animate({
      width: width + "%"
    }, 500);
  },

  _calcTotalMapViews: function() {
    return _.reduce(this.model.get("api_calls"), function(memo, num){ return memo + num; }, 0);
  },

  _calcMapViewsPercentage: function(map_views) {
    return (map_views / this.model.get("api_calls_quota")) * 100;
  },

  /*
  * Disabled the warning upgrade flash
  */
  _disableWarning: function(ev) {
    ev.preventDefault();

    if (this.recently_upgraded) {
      // Reset value due to render function is called
      // when there is a change in the table
      this.recently_upgraded = false;
    } else if (!this.localStorage.get('limit') && this.warning_type == "limit") {
      this.localStorage.set({ 'limit': true});
      this.warning = false;
    } else if (!this.localStorage.get('cartodb20')) {
      // Set localStorage to not show again CartoDB2.0 text
      this.localStorage.set({ 'cartodb20': true})
    }

    this._hideWarning();
  },

  /*
  * Show the warning upgrade flash
  */
  _showWarning: function(type) {
    this.$el.find("section.warning")
    .removeClass("upgraded limit cartodb20")
    .addClass("visible " + type);
  },

  /*
  * Hide the warning upgrade flash
  */
  _hideWarning: function() {
    this.$el.find("section.warning").removeClass("visible");
  },

  /*
  * Show dedicated support
  */
  _showDedicatedSupport: function() {
    this.$el.closest("body").find("article.support").show();
  },

  /*
  * Hide dedicated support
  */
  _hideDedicatedSupport: function() {
    this.$el.closest("body").find("article.support").hide();
  },

  /*
  * Activate the table stats
  */
  _activate: function() {
    this.$el.addClass("active");
  },

  /*
  * Desactivate the table stats
  */
  _desactivate: function() {
    this.$el.removeClass("active");
  },

  /*
  * Convert bytes to any size
  */
  _bytesToSize: function(total_bytes, used_bytes) {
    var sizes = ['bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes'];
    if (total_bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(total_bytes) / Math.log(1024)));
    return {total: (total_bytes / Math.pow(1024, i)).toFixed(1), used: (used_bytes / Math.pow(1024, i)).toFixed(1), size: sizes[i]};
  },

  _formatNumber: function(str) {
    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";
    for ( var i = 0; i <= amount.length-1; i++ ){
      output = amount[i] + output;
      if ((i+1) % 3 == 0 && (amount.length-1) !== i)output = ',' + output;
    }
    return output;
  }

});
