
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

  cdb.admin.dashboard.Scenario = cdb.core.View.extend({

    initialize: function() {
      this.$welcome = this.$('article.no_tables');
      this.tables = this.options.tables;

      this.tables.bind('add remove reset', this.render, this);
    },

    render: function() {
      var active = this.tables.size() > 0;
      this.$welcome[ active ? 'removeClass' : 'addClass' ]('active');
    }
  });