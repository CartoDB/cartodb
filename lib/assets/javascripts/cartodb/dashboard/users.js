
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
      // Calculate quotas first
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

        // D3 API Requests
        this.stats = this.stats = new cdb.admin.D3Stats({
          el: this.$el.find("li:eq(2)"),
          api_calls: this.model.attributes.api_calls
        });
      }

      // Animate the stats change
      this._animateChange();

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
     * Calculate user quotas (calculations will be in the model)
     */
    _calculateQuotas: function() {

      var attrs = this.model.toJSON();

      // Check tables count quota status
      if (attrs.table_quota == null || attrs.table_quota == 0) {
        attrs.table_quota_status = "green";
      } else if (((attrs.table_count / attrs.table_quota) * 100) < 80) {
        attrs.table_quota_status = "";
      } else if (((attrs.table_count / attrs.table_quota) * 100) < 90) {
          attrs.table_quota_status = "danger";
      } else {
          attrs.table_quota_status = "boom";
      }

      // Check table space quota status
      if (attrs.byte_quota == null || attrs.byte_quota == 0) {
        attrs.byte_quota_status = "green";
      } else if ((((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) < 80) {
        attrs.byte_quota_status = "";
      } else {
        if ((((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) < 90) {
          attrs.byte_quota_status = "danger";
        } else {
          attrs.byte_quota_status = "boom";
        }
      }

      this.model.attributes = attrs;
    },

    /*
     * Animate the changes in the view
     */
    _animateChange: function() {

      var attrs = this.model.toJSON()
        , $tables = this.$el.find("section.stats li:eq(0)")
        , $space = this.$el.find("section.stats li:eq(1)")
        , width = 4
        , text = "";


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
        },500);


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
        },500);
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
    }
  });
