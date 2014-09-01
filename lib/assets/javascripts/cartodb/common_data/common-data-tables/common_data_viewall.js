
  /**
   *
   *
   *
   */

  cdb.admin.CommonData.ViewAll = cdb.core.View.extend({

    className: 'tables-view-all',

    events: {
      'click a': '_onViewAll'
    },

    initialize: function() {
      _.bindAll(this, '_onViewAll');
      this.template = cdb.templates.getTemplate('common_data/views/common_data_viewall');
      this.router = this.options.router;
    },
    
    render: function() {
      this.clearSubViews();
      this.$el.empty();

      this.$el.append(this.template(this.model.attributes));

      return this;
    },

    _onViewAll: function(e) {
      if (e) this.killEvent(e);
      var tag = $(e.target).attr('href').replace('#/','');
      this.router.navigate('/' + tag, { trigger: true });
    }

  })