
(function() {

  /**
   * dasboard table stats
   */
  var TableStats = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {

      this.model = new cdb.admin.User({ id : this.options.userid });

      this.template = cdb.templates.getTemplate('dashboard/views/table_stats_list');

      this.options.tables.bind('add',     this.tableChange, this);
      this.options.tables.bind('remove',  this.tableChange, this);
      this.options.tables.bind('reset',   this.tableChange, this);

      this.model.bind('change', this.render, this);
    },

    tableChange: function() {
      this.model.fetch();
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  cdb.admin.dashboard.TableStats = TableStats;
})();



cdb.admin.User = Backbone.Model.extend({
  urlRoot: '/api/v1/users',
  initialize: function() {}
});
