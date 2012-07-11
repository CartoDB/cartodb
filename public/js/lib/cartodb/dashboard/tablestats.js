
(function() {

  /**
   * dasboard table stats
   */
  var TableStats = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      this.model.bind('reset', this.reset, this);
      this.model.bind('add', this.add, this);
      this.model.bind('remove', this.remove, this);
    },

    reset: function() {
      this.render();
    },

    add: function(m) {
      cdb.log.info(m);
    },

    remove: function(m) {
      cdb.log.info(m)
    },

    render: function() {
      cdb.log.info(this.model)

    }
  });

  cdb.admin.dashboard.TableStats = TableStats;

})();
