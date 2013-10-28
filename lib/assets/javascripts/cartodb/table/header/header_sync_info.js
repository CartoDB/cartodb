
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

    tagName: 'div',
    className: 'sync_info',

    _TEXTS: {
      // failure: _t('This table will be synced again in'),
      enabled: _t('This table will be synced again <%= run_at %>')
    },

    events: {
      'click a.sync_options': '_onClickOptions'
    },

    initialize: function() {
      this.table = this.options.table;
      this.model = this.table.synchronization;
      this.template = cdb.templates.getTemplate('table/header/views/sync_info_content');
      this.model.bind('change:state', this.render, this);
    },

    render: function() {
      var attrs = _.clone(this.model.attributes);

      attrs.ran_at = moment(attrs.ran_at || new Date()).fromNow();
      attrs.run_at = moment(attrs.run_at || new Date()).fromNow();

      this.$el.html(this.template(attrs));

      return this;
    },

    _onClickOptions: function(e) {
      this.killEvent(e);

      var dlg = new cdb.admin.SyncSettings({
        table: this.table
      });

      dlg
        .appendToBody()
        .open();
    }

  })
