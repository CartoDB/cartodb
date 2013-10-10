
  /**
   *  Header sync info when visualization is table type
   *
   *  - If there is any change in the state, it will be rendered again.
   *
   *  new cdb.admin.SyncInfo({
   *    model: synchronization_model
   *  });
   */

  cdb.admin.SyncInfo = cdb.core.View.extend({

    tagName: 'li',
    className: 'sync_info',

    initialize: function() {
      this.template = cdb.templates.getTemplate('table/header/views/sync_info_content');
      this.model.bind('change:state', this.render, this);
    },

    render: function() {
      var attrs = _.clone(this.model.attributes);

      attrs.ran_at = moment(attrs.ran_at || new Date()).fromNow();

      this.$el.html(this.template(attrs));
      return this;
    }

  })

  