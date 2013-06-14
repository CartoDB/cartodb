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
    'click section.warning a.close': '_disableWarning',
    'click .tables .progress':       '_gotoTables',
    'click .mapviews .progress':     '_gotoVisualizations'
  },

  initialize: function() {

    if (!this.options.user_stats) this.options.user_stats = "";

    this.template = cdb.templates.getTemplate('dashboard/views/user_stats');

    this._setupLocalStorage();
    this._setupBindings();
    this._checkUpgradedUser();
  },

  _setupLocalStorage: function() {

    // Control messages with LocalStorage
    // - Limit message ->       'limit'       -> Expire with the session

    // Recently upgraded message is under control thanks to a central request
    // - Upgraded message ->    'upgraded'    -> It doesn't expire, comes from server

    // Init localStorage
    var key = this.options.localStorageKey || 'cartodb_user';

    this.limitStorage     = new cdb.admin.localStorage(key + "_limit");
    this.migratedStorage  = new cdb.admin.localStorage(key + "_migrated");

  },

  _gotoVisualizations: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.trigger("gotoVisualizations", this);

  },

  _gotoTables: function(e) {

    e && e.preventDefault();
    e && e.stopPropagation();

    this.trigger("gotoTables", this);
  },

  _setupBindings: function() {

    var self = this;

    this.options.tables.bind("add remove reset",       this._refresh, this);
    this.model.bind('change:table_count',              this._refresh, this);

    this.model.bind("change:table_quota_status",       this._onTablesQuotaStatusChange, this);
    this.model.bind("change:byte_quota_status",        this._onSpaceQuotaStatusChange, this);
    this.model.bind("change:mapviews_quota_status",    this._onMapViewsQuotaStatusChange, this);

    this.model.bind("change:limits_tables_exceeded",   this._refresh, this);
    this.model.bind("change:limits_space_exceeded",    this._refresh, this);
    this.model.bind("change:limits_mapviews_exceeded", this._refresh, this);

  },

  _refresh: function() {
    this._calculateQuotas();
    this._updateGraphs();
    this._toggleWarnings();
  },

  _onTablesQuotaStatusChange: function(m) {
    var status = m.get("table_quota_status");

    if (status == "boom" || status == "danger")
      this.model.set("limits_tables_exceeded", "tables");
    else
      this.model.set("limits_tables_exceeded", null);
  },

  _onSpaceQuotaStatusChange: function(m) {
    var status = m.get("byte_quota_status");

    if (status == "boom" || status == "danger")
      this.model.set("limits_space_exceeded", "space");
    else
      this.model.set("limits_space_exceeded", null);
  },

  _onMapViewsQuotaStatusChange: function(m) {
    var status = m.get("mapviews_quota_status");

    if (status == "boom" || status == "danger")
      this.model.set("limits_mapviews_exceeded", "mapviews");
    else
      this.model.set("limits_mapviews_exceeded", null);
  },

  render: function() {

    this.$el.html(this.template(_.extend(this.model.toJSON(), this.options)));

    this._calculateQuotas();

    this._toggleUserStats();
    this._toggleDedicatedSupport();

    if (this.model.get("table_quota") === null ) {
      this.$('.progress').addClass('unlimited')
    }

    // Rendering for the first time?
    if (!this.options.loaded) {
      this.options.loaded = !this.options.loaded;
    }

    this._updateGraphs();
    this._toggleWarnings();

    return this;
  },

  _toggleUserStats: function() {
    (this.model.get("table_count") > 0) ? this._activate() : this._deactivate();
  },

  _toggleDedicatedSupport: function() {
    this.model.get("dedicated_support") ? this._showDedicatedSupport() : this._hideDedicatedSupport();
  },

  /**
  *  Manage how and when we should show any warning message
  */
  _toggleWarnings: function() {

    if (config && config.custom_com_hosted) return;

    if (this.recently_upgraded) {
      this._showWarning('upgraded');
      return;
    }

    if (!this.migratedStorage.get('migrated') && !this.model.get("migrated") ) {
      this._showWarning('migrated');
      return;
    }

    if (!this.limitStorage.get('limit') && this.model.get("limits_tables_exceeded")) {
      this._showWarning('limit');
      return;
    }

    this._hideWarning();

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
          self._toggleWarnings();
        },
        error: function(e) {
          self._toggleWarnings();
        }
      });
    }

  },

  /*
  * Calculate user quotas status
  */
  _calculateQuotas: function() {

    this.model.set("table_quota_status",    this._calculateTableQuota());
    this.model.set("byte_quota_status",     this._calculateSpaceQuota());
    this.model.set("mapviews_quota_status", this._calculateMapViewsQuota());

  },

  _calculateTableQuota: function() {

    var quota = this.model.get("table_quota");
    var count = this.model.get("table_count");

    if (quota == null || quota == 0) return "green";

    var p = (count / quota * 100);

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";

  },

  _calculateSpaceQuota: function() {

    var quota           = this.model.get("byte_quota");
    var remaining_quota = this.model.get("remaining_byte_quota");

    if (quota == null || quota == 0) return "green";

    var p = ((quota - remaining_quota) / quota) * 100;

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";

  },

  _calculateMapViewsQuota: function() {

    var quota = this.model.get("api_calls_quota");

    if (quota == null || quota == 0) return "green";

    var sum = this._calcTotalMapViews();
    var p   = this._calcMapViewsPercentage(sum);

    if (p < 80) return "";
    if (p < 90) return "danger";

    return "boom";

  },

  _updateGraphs: function() {
    this._updateTableGraph();
    this._updateSpaceGraph();
    this._updateMapViewsGraph();
  },

  _updateTableGraph: function() {

    var quota  = this.model.get("table_quota");
    var count  = this.model.get("table_count");
    var status = this.model.get("table_quota_status");

    var p = 100, limit = "∞";

    if (quota != null && quota > 0) {
      p = (count / quota) * 100;
      limit = quota;
    }

    var text  = "<strong>" + count + " of " + limit + "</strong> tables created";
    var $el   = this.$el.find("section.stats .tables");

    this._updateGraph($el, p, text, status);

  },

  _updateSpaceGraph: function() {

    var quota           = this.model.get("byte_quota");
    var remaining_quota = this.model.get("remaining_byte_quota");
    var status          = this.model.get("byte_quota_status");

    var $el    = this.$el.find("section.stats .size");

    var space_stats = {};

    if (quota == null || quota == 0) {
      space_stats.total = "∞";
    } else {
      space_stats = this._bytesToSize(quota, (quota - remaining_quota));
    }

    var width = 100;
    var text = "You have <strong>" + space_stats.total + " space</strong>";

    if (quota != null && quota > 0) {
      width = (( space_stats.used / space_stats.total) * 100);
      text = "<strong>" + space_stats.used + " of " + space_stats.total + "</strong> used " + space_stats.size;
    }

    this._updateGraph($el, width, text, status);

  },

  _updateMapViewsGraph: function() {

    var status = this.model.get("mapviews_quota_status");

    var $el = this.$el.find("section.stats .mapviews");

    var sum   = this._calcTotalMapViews();
    var width = this._calcMapViewsPercentage(sum);

    var text = '<strong>' + this._formatNumber(sum) + '</strong> map views in the last 30 days';

    this._updateGraph($el, width, text, status);

  },

  _updateGraph: function($el, percentage, message, status) {

    if (percentage != NaN) {

      $el.find("p").html(message);

      $el.find(".progress span")
        .removeAttr("class").addClass(status)
        .animate({
          width: percentage + "%"
        }, 500);
    }

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

      this.recently_upgraded = false;

    } else if (!this.limitStorage.get('limit') && this.warning_type == "limit") {

      this.limitStorage.set({ "limit": true });
      this.warning_type = null;

    } else if (!this.migratedStorage.get('migrated') && this.warning_type == "migrated") {

      this.migratedStorage.set({ "migrated": true });
      this.warning_type = null;

    }

    this._hideWarning();
  },

  /*
  * Show the warning upgrade flash
  */
  _showWarning: function(type) {

    this.warning_type = type;

    this.$el.find("section.warning")
    .removeClass("upgraded migrated limit")
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
  * Deactivate the table stats
  */
  _deactivate: function() {
    this.$el.removeClass("active");
  },

  /*
  * Convert bytes to any size
  */
  _bytesToSize: function(total_bytes, used_bytes) {
    var sizes = ['bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes'];
    if (total_bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(total_bytes) / Math.log(1024)));

    return { total: (total_bytes / Math.pow(1024, i)).toFixed(1), used: (used_bytes / Math.pow(1024, i)).toFixed(1), size: sizes[i] };
  },

  _formatNumber: function(str) {

    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";

    for ( var i = 0; i <= amount.length-1; i++ ){

      output = amount[i] + output;
      if ((i+1) % 3 == 0 && (amount.length-1) !== i) output = ',' + output;

    }

    return output;
  }

});
