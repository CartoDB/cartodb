
  /*
   *  Dashboard support block
   *
   *  - It will be displayed when user is not free
   */

  cdb.admin.DashboardSupport = cdb.core.View.extend({

    initialize: function() {
      this.model.bind('change:actions', this.render, this);
      this.render();
    },

    render: function() {
      var template = cdb.templates.getTemplate('dashboard/views/dashboard_support');
      this.$el.html(template(this.model.get('actions')));
      return this;
    }
  })