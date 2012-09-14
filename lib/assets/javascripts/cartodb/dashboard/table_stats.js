

(function() {

  /**
   * User stats embeded in the dashboard
   *
   * It shows the tables and the space used in the user account
   * You must set the username, the user id and the tables model,
   * if not, it won't work.
   *
   * Usage example:
   *
      this.tableStats = new cdb.admin.dashboard.TableStats({
        el: $('div.subheader'),
        model: this.user**
      })

      **  It needs a user model to work properly.
   *
   */

  var TableStats = cdb.core.View.extend({
    
    defaults: {
      loaded: false
    },

    events: {
      'click section.warning a.close':  '_disableWarning'
    },

    initialize: function() {

      // If the user doesn't want to see the warning anymore
      this.warning = true;

      // Any change, render this view
      this.model.bind('change', this.render, this);
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
      if (this.model.get("account_type") != "FREE") {
        this._showDedicatedSupport();
      } else {
        this._hideDedicatedSupport();
      }

      // If there is danger...
      if ((this.model.get('byte_quota_status') != "" || this.model.get('table_quota_status') != "") 
        && this.model.get("table_quota") != null 
        && this.model.get("byte_quota") != null) {
        this._showWarning();
      } else {
        this._hideWarning();
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

      return this;
    },


    /*
     * Calculate user quotas (calculations will be in the model)
     */
    _calculateQuotas: function() {

      var attrs = this.model.toJSON();

      // Check tables count quota status
      if (attrs.table_quota == null) {
        attrs.table_quota_status = "green";
      } else if (((attrs.table_count / attrs.table_quota) * 100) < 80) {
        attrs.table_quota_status = "";
      } else if (((attrs.table_count / attrs.table_quota) * 100) < 90) {
          attrs.table_quota_status = "danger";
      } else {
          attrs.table_quota_status = "boom";
      }

      // Check table space quota status
      if (attrs.byte_quota == null) {
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
      if (attrs.table_quota == null) {
        width = 100;
        text = "You have <strong>∞ tables</strong>";
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
      var remaining_quota = (( attrs.byte_quota - attrs.remaining_byte_quota ) / (1024*1024)).toFixed(2)
        , remaining_in_bytes = remaining_quota == 0.00 ? 0 : remaining_quota
        , total_quota = attrs.byte_quota == null ? "∞" : (attrs.byte_quota / (1024*1024)).toFixed(0)

      if (attrs.byte_quota == null) {
        width = 100;
        text = "You have <strong>∞ space</strong>";
      } else {
        width = (((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100);
        text = "<strong>" + remaining_in_bytes + " of " + total_quota + "</strong> used megabytes";
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
      this.warning = false;
      this._hideWarning();
    },


    /*
     * Show the warning upgrade flash
     */
    _showWarning: function() {
      if (this.warning)
        this.$el.find("section.warning").addClass("visible");
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
    }
  });

  cdb.admin.dashboard.TableStats = TableStats;
})();



