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
    'click .tables   .progress':  '_gotoTables',
    'click .mapviews .progress':  '_gotoVisualizations',
    'click .mapviews .stats':     '_gotoVisualizations'
  },

  initialize: function() {

    if (!this.options.user_stats) this.options.user_stats = "";

    this.template = cdb.templates.getTemplate('dashboard/views/user_stats');
    this.router = this.options.router;

    this.messages = new cdb.admin.dashboard.Messages({
      config: config,
      username: this.model.get("username"),
      localStorageKey: this.options.localStorageKey
    });

    this._setupBindings();
    this._performChecks();
  },

  _performChecks: function() {

    this._checkForNotifications();
    this._checkUpgradedUser();
    this._checkTrialExpired();
    this._checkTrialSuggestion();

  },

  _gotoVisualizations: function(e) {
    this.killEvent(e);
    this.router.navigate('visualizations', { trigger: true });
  },

  _gotoTables: function(e) {
    this.killEvent(e);
    this.router.navigate('tables', { trigger: true });
  },

  _setupBindings: function() {

    var self = this;

    this.options.tables.bind("add remove reset",       this._onTablesChange, this);
    this.model.bind('change:table_count',              this._refresh, this);

    this.model.bind("change:table_quota_status",       this._onTablesQuotaStatusChange, this);
    this.model.bind("change:byte_quota_status",        this._onSpaceQuotaStatusChange, this);
    this.model.bind("change:mapviews_quota_status",    this._onMapViewsQuotaStatusChange, this);

  },

  _onTablesChange: function() {
    this.model.fetch();
  },

  _refresh: function() {
    this._calculateQuotas();
    this._updateGraphs();
    this._performChecks();
  },

  _removeLimitMessage: function() {

    var tableLimit    = this.model.get("limits_tables_exceeded"),
        tableQuota    = this.model.get("table_quota_status");
    var mapviewsLimit = this.model.get("limits_mapviews_exceeded"),
        mapviewsQuota = this.model.get("mapviews_quota_status");
    var spaceLimit    = this.model.get("limits_space_exceeded"),
        spaceQuota    = this.model.get("mapviews_quota_status");

    if (
        (
             tableLimit === null
          && mapviewsLimit === null
          && (spaceLimit === null  || spaceLimit === undefined )
        )
      || (tableLimit === 'table' && tableQuota === 'boom')
      || (mapviewsLimit === 'mapviews' && mapviewsQuota === 'boom')
      || (spaceLimit === 'space' && spaceQuota === 'boom')
    ) {
      this.messages.removeMessage("limits_exceeded");
    }

  },

  _onTablesQuotaStatusChange: function(m) {

    var status = m.get("table_quota_status");

    if (status === "boom") {
      this.model.set("limits_tables_exceeded", "tables");
      this.messages.addMessage("limits_tables_exceeded", this.model.attributes);
      this.messages.removeMessage("limits_exceeded");
    } else if (status === "danger") {
      this.model.set("limits_tables_exceeded", "tables");
      this.messages.addMessage("limits_exceeded", this.model.attributes);
      this.messages.removeMessage("limits_tables_exceeded");
    } else {
      this.model.set("limits_tables_exceeded", null);
      this.messages.removeMessage("limits_tables_exceeded");
    }

    this._removeLimitMessage();
    this._refresh();

  },

  _onSpaceQuotaStatusChange: function(m) {

    var status = m.get("byte_quota_status");

    // Don't show the space warning message if we are already showing the table limit one
    if (this.model.get("limits_tables_exceeded") == "tables") return;

    if (status === "boom") {
      this.model.set("limits_space_exceeded", "space");
      this.messages.addMessage("limits_space_exceeded", this.model.attributes);
      this.messages.removeMessage("limits_exceeded");
    } else if (status === "danger") {
      this.model.set("limits_space_exceeded", "space");
      this.messages.addMessage("limits_exceeded", this.model.attributes);
      this.messages.removeMessage("limits_space_exceeded");
    } else {
      this.model.set("limits_space_exceeded", null);
      this.messages.removeMessage("limits_space_exceeded");
    }

    this._removeLimitMessage();
    this._refresh();

  },

  _onMapViewsQuotaStatusChange: function(m) {

    var status = m.get("mapviews_quota_status");

    if (status == "boom") {

      var api_calls_block_price = this.model.get("api_calls_block_price");

      if (api_calls_block_price > 0) {
        var overage_quota = api_calls_block_price / 100; // price comes in cents, we show dollars

        this.model.set("limits_mapviews_exceeded", "mapviews");
        this.model.set("mapviews_overage_quota", overage_quota);
        this.messages.addMessage("limits_mapviews_exceeded", this.model.attributes);
        this.messages.removeMessage("limits_exceeded");
      }

    } else if (status === "danger") {
      this.model.set("limits_mapviews_exceeded", "mapviews");
      this.messages.addMessage("limits_exceeded", this.model.attributes);
      this.messages.removeMessage("limits_mapviews_exceeded");
    } else {
      this.model.set("limits_mapviews_exceeded", null);
      this.messages.removeMessage("limits_mapviews_exceeded");
    }

    this._removeLimitMessage();
    this._refresh();

  },

  _chooseBadge: function() {

    var account_type = this.model.get("account_type").toLowerCase();
    var belongsOrg = this.model.isInsideOrg() || this.model.isOrgAdmin();
    
    // Check if user belongs to a Organization
    if (belongsOrg) {
      return "enterprise";
    }

    if      (account_type.indexOf("john snow") != -1 ) return "john_snow";
    else if (account_type.indexOf("magellan")  != -1 ) return "magellan";
    else if (account_type.indexOf("mercator")  != -1 ) return "mercator";
    else if (account_type.indexOf("coronelli") != -1 ) return "coronelli";
    else if (account_type.indexOf("internal")  != -1 ) return "internal";
    else if (account_type.indexOf("lump")      != -1 ) return "dedicated";
    else if (account_type.indexOf("enterprise")!= -1 ) return "dedicated";
    else if (
         account_type.indexOf("dedicated") != -1
      || account_type.indexOf("xs") != -1
      || account_type.indexOf("s")  != -1 && account_type.length == 1
      || account_type.indexOf("m")  != -1 && account_type.length == 1
      || account_type.indexOf("l")  != -1 && account_type.length == 1
    ) return "dedicated";
    else if (account_type.indexOf("free")      != -1 ) return "free";
    else return "default";

  },

  render: function() {

    this.$el.html(this.template(
      _.extend(this.model.toJSON(), {
        badge: this._chooseBadge(),
        belongsOrg: this.model.isInsideOrg(),
        isOrgAdmin: this.model.isOrgAdmin(),
      })
    ));
    this.$el.append(this.messages.render().$el);

    this._calculateQuotas();

    this._toggleUserStats();

    if (this.model.get("table_quota") === null ) {
      this.$('.progress').addClass('unlimited')
    }

    // Rendering for the first time?
    if (!this.options.loaded) {
      this.options.loaded = !this.options.loaded;
    }

    this._updateGraphs();

    return this;
  },

  _toggleUserStats: function() {
    (this.model.get("table_count") > 0) ? this._activate() : this._deactivate();
  },

  _checkTrialSuggestion: function() {
    // User shouldnt be in a organization, user should be free
    // and user should have tables
    if (!this.model.isInsideOrg() && this.model.get("account_type") === 'FREE' && this.model.get("table_count") > 0) {
      this.messages.addMessage("try_trial", this.model.attributes);
    } else {
      this.messages.removeMessage("try_trial");
    }

  },

  _checkTrialExpired: function() {

    if (this.model.get("show_trial_reminder")) {
      this.messages.addMessage("trial_ends_soon", this.model.attributes);
    }

  },

  /**
   *  Check if the user has a notification to show
   */
  _checkForNotifications: function() {

    var notification = this.model.get("notification");

    if (notification) {
      this.messages.addMessage("notification", { notification: notification });
    }

  },

  /**
  *  Check if the user has recently upgraded his account
  */
  _checkUpgradedUser: function() {

    if (config && !config.custom_com_hosted && config.account_host) {

      var show_upgraded_message = this.model.get("show_upgraded_message");

      if (show_upgraded_message) {
        this.messages.addMessage("upgraded", this.model.attributes);
      } else {
        this.messages.resetClosedStatus("upgraded");
      }

    }

  },

  /*
  * Calculate user quotas status
  */
  _calculateQuotas: function() {

    var tableLimit    = this._calculateTableQuota();
    var mapviewsLimit = this._calculateMapViewsQuota();
    var spaceLimit    = this._calculateSpaceQuota();

    this.model.set("table_quota_status",    tableLimit);
    this.model.set("byte_quota_status",     spaceLimit);
    this.model.set("mapviews_quota_status", mapviewsLimit);

  },

  _calculateTableQuota: function() {

    var quota = this.model.get("table_quota");
    var count = this.model.get("table_count");

    if (quota == null || quota == 0) return "green";

    var p = (count / quota * 100);

    if (p < 80) return "";
    if (p < 100) return "danger";

    return "boom";

  },

  _calculateSpaceQuota: function() {

    var quota           = this.model.get("quota_in_bytes");
    var remaining_quota = this.model.get("remaining_byte_quota");

    if (quota == null || quota == 0) return "green";

    var p = ((quota - remaining_quota) / quota) * 100;

    if (p < 80) return "";
    if (p < 100) return "danger";

    return "boom";

  },

  _calculateMapViewsQuota: function() {

    // No more exceeded messages about mapviews
    return "green";

    var quota = this.model.get("api_calls_quota");

    if (quota == null || quota == 0) return "green";

    var sum = this._calcTotalMapViews();
    var p   = this._calcMapViewsPercentage(sum);

    if (p < 80) return "";
    if (p < 100) return "danger";

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

    var quota           = this.model.get("quota_in_bytes");
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
    var $stats = $('<div>').addClass('stats');
    var sum = this._calcTotalMapViews();

    this.$("section.stats .mapviews")
      .empty()
      .append($stats);

    var user_stats = new cdb.admin.SimpleD3Stats({
      el: this.$("section.stats .mapviews"),
      api_calls: _.clone(this.model.get('api_calls')).reverse(),
      width: 233
    });

    // Add mapviews
    this.$("section.stats .mapviews").append(
      $('<p>')
        .addClass('block center')
        .text(this._formatMapViews(sum) + ' map view' + ( sum !== 1 ? 's' : '' ) + ' this month')
    )

  },

  _updateMapViewsBar: function() {
    var status = this.model.get("mapviews_quota_status");

    var $el = this.$el.find("section.stats .mapviews");

    var sum   = this._calcTotalMapViews();
    var width = this._calcMapViewsPercentage(sum);
    var total = this.model.get("api_calls_quota");
    var date  = this.model.get("billing_period");

    var text = '<strong>' + this._formatMapViews(sum) + '</strong> of <strong>' + this._formatMapViews(total) + '</strong> map views <div class="info">?</div>';

    this._updateGraph($el, width, text, status);

    var str = this._formatNumber(sum) + ' of ' + this._formatNumber(total) + ' map views since <br />your last billing period (' + date + ')';

    this.$el.find('.info').tipsy({
      gravity: 's',
      html: true,
      fade: true,
      offset: -1,
      className: 'stats',
      title: function() {
        return str;
      }
    });
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
  * Hide the warning upgrade flash
  */
  _hideWarning: function() {
    //this.$el.find("section.warning").removeClass("visible");
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

  _formatMapViews: function(str) {

    if (!str) str = "0";

    var value = parseInt(str, 10);

    var k = value/1000;
    var m = value/1000000;
    var g = value/1000000000;

    var output;

    if (g > 1) {
      output = parseFloat(g.toFixed(2), 10).toString() + "G";
    } else if (m > 1) {
      output = parseFloat(m.toFixed(2), 10).toString() + "M"
    } else if (k > 1) {
      output = parseFloat(k.toFixed(2), 10).toString() + "K"
    } else {
      output = value;
    }

    return output;

  },

  _formatNumber: function(str) {

    if (!str) str = "0";

    var amount = new String(str);

    amount = amount.split("").reverse();

    var output = "";

    for ( var i = 0; i <= amount.length-1; i++ ){

      output = amount[i] + output;

      if ((i + 1) % 3 == 0 && (amount.length - 1) !== i) output = ',' + output;

    }

    return output;
  }

});
