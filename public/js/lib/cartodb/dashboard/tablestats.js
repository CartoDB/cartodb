
(function() {

  /**
   * dasboard table stats
   */
  var TableStats = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/table_stats_list');

      this.model.bind('reset', this.reset, this);
      this.model.bind('add', this.add, this);
      this.model.bind('remove', this.remove, this);
    },

    reset: function() {
      cdb.log.info("fetch")
      this.render();
    },

    add: function(m) {
      cdb.log.info(m);
    },

    remove: function(m) {
      cdb.log.info("remove")
      cdb.log.info(m)
    },

    render: function() {
      var self = this;
      $.ajax({
        type: "GET",
        url: "/api/v1/users/" + this.options.userid,
        dataType: "json",
        success: function(r) {
          self.$el.html(self.template(r));

          return self;
        },
        error: function(e) {
          cdb.log.info(e)
        }
      });
    }
  });

  cdb.admin.dashboard.TableStats = TableStats;

})();
