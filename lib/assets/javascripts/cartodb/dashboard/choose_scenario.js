

(function() {

  /**
   * Manage which scenario should show, empty-dashboard or table-list
   *
   * If the user doesn't have any table, the "dashboard empty article"
   * will show up, else, the table list will be present.
   *
   * Usage example:
   *
      var scenario = new cdb.admin.dashboard.Scenario({
        el: $("body"),
        model: model.user*
      });

      * It needs a user model to run correctly.
  */

  var Scenario = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, "_updateScenario");

      // Article when there is NO tables
      this.$empty_article = this.$el.find("article.no_tables");
      // Article when there are tables
      this.$tables_article = this.$el.find("article.tables");

      this.model.bind('change', this._updateScenario, this);
    },

    render: function() {
      var table_count = this.model.get("table_count");

      if (table_count > 0) {
        this.$empty_article.removeClass("active");
        this.$tables_article.addClass("active");
      } else {
        this.$tables_article.removeClass("active");
        this.$empty_article.addClass("active");
      }
    },

    /**
     * Update the scenario
     */    
    _updateScenario: function() {
      this.render();
    }
  });

  cdb.admin.dashboard.Scenario = Scenario;
})();