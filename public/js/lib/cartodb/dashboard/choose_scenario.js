

(function() {
  /**
   * Manage which article shows, empty-dashboard or table-list
   */
  var Scenario = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, "_updateScenario");

      // Article when there is NO tables
      this.$empty_article = this.el.$("article.no_tables");
      // Article when there are tables
      this.$tables_article = this.el.$("article.tables");

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

    _updateScenario: function() {
      this.render();
    }
  });

  cdb.admin.dashboard.Scenario = Scenario;
})();