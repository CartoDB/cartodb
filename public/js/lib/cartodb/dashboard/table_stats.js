/**
 * User stats embeded in the dashboard
 *
 * It shows the tables and the space used in the user account
 * You must set the username, the user id and the tables model,
 * if not, it won't work.
 *
 * usage example:
 *
 *    this.tableStats = new cdb.admin.dashboard.TableStats({
 *      el: this.$('div.subheader'),
 *      username: "admin",
 *      userid: 1,
 *      tables: tables.model
 *    })
 *
 *
 * TODO:
 *  - Animate progress colors (not possible with gradients)
 *  - Animate numbers from the beginning
*/



(function() {

  /**
   * Dasboard table stats
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

      // If any change happened in the tables model, fetch the user stats
      this.options.tables.bind('add',     this._tableChange, this);
      this.options.tables.bind('remove',  this._tableChange, this);
      this.options.tables.bind('reset',   this._tableChange, this);

      // Any change, render this view
      this.model.bind('change', this.render, this);
    },


    /*
     * Table change function -> Fetch model!
     */
    _tableChange: function() {
      this.model.fetch();
    },


    render: function() {

      // Calculate quotas first
      this._calculateQuotas();

      // If there is danger...
      if (this.model.attributes.byte_quota_status != "" || this.model.attributes.table_quota_status != "") {
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

      this._animateChange();

      return this;
    },


    /*
     * Calculate user quotas (calculations will be in the model)
     */
    _calculateQuotas: function() {

      var attrs = this.model.attributes;

      // Check tables count quota status
      if (((attrs.table_count / attrs.table_quota) * 100) < 80) {
        attrs.table_quota_status = "";
      } else {
        if (((attrs.table_count / attrs.table_quota) * 100) < 90) {
          attrs.table_quota_status = "danger";
        } else {
          attrs.table_quota_status = "boom";
        }
      }

      // Check table space quota status
      if ((((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) < 80) {
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

      var attrs = this.model.attributes
        , $tables = this.$el.find("section.stats li:eq(0)")
        , $space = this.$el.find("section.stats li:eq(1)");

      // Tables change
      $tables.find("p").html("<strong>" + attrs.table_count + " of " + attrs.table_quota + "</strong> tables created");
      $tables.find("div.progress span")
        .removeAttr("class").addClass(attrs.table_quota_status)
        .animate({
          width: ((attrs.table_count / attrs.table_quota) * 100) + "%"
        },500);

      // Space change
      $space.find("p").html("<strong>" + (( attrs.byte_quota - attrs.remaining_byte_quota ) / (1024*1024)).toFixed(2) + " of " + (attrs.byte_quota / (1024*1024)).toFixed(0) + "</strong> used megabytes");
      $space.find("div.progress span")
        .removeAttr("class").addClass(attrs.byte_quota_status)
        .animate({
          width: (((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) + "%"
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
    }
  });

  cdb.admin.dashboard.TableStats = TableStats;
})();



