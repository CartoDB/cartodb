
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
      enabled: _t('This table will be synced again <%= run_at %>'),
      few_moments: _t('in a few moments')
    },

    events: {
      'click a.sync_options': '_onClickOptions'
    },

    initialize: function() {
      this.table = this.options.table;
      this.model = this.table.synchronization;
      this.template = cdb.templates.getTemplate('table/header/views/sync_info_content');
      this.model.bind('change', this.render, this);
    },

    render: function() {
      var attrs = _.clone(this.model.attributes);

      attrs.ran_at = moment(attrs.ran_at || new Date()).fromNow();

      // Due to the time we need to polling, we have to display to the user
      // that the sync will be in a few moment
      if (!attrs.run_at || (new Date(attrs.run_at) <= new Date())) {
        attrs.run_at = this._TEXTS.few_moments;
      } else {
        attrs.run_at = moment(attrs.run_at).fromNow();
      }

      this.$el
        .html(this.template(attrs))
        .attr('class', '')
        .addClass(attrs.state + ' ' + this.className);

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
