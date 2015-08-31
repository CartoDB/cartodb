
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

    _SYNC_GAP: 15,      // Gap necessary to perform next synchronization
                        // Value in MINUTES
    _POLLING_GAP: 15,   // Gap necessary to start polling and checking
                        // synchronization. Value in SECONDS

    _TEXTS: {
      enabled:            _t('This table will be synced again <%- run_at %>'),
      few_moments:        _t('in a few moments'),
      sync_now_disabled:  _t('You will be able to sync manually <%- gap %> minutes after your last synchronization')
    },

    events: {
      'click a.sync_options': '_onClickOptions',
      'click a.sync_now':     '_onClickSyncNow'
    },

    initialize: function() {
      _.bindAll(this, '_startSync');

      this.dataLayer = this.options.dataLayer;
      this.table = this.dataLayer.table;
      this.model = this.table.synchronization;
      this.template = cdb.templates.getTemplate('table/header/views/sync_info_content');
      this.model.bind('change', this.render, this);

      // Check sync now button
      if (this._isSyncing()) {
        this._showSyncNow();
        this._startSync();
      }
    },

    render: function() {
      var attrs = _.clone(this.model.attributes);
      var self = this;

      // Destroy tipsy just in case
      this._destroyTipsy();

      attrs.ran_at = moment(attrs.ran_at || new Date()).fromNow();

      // Due to the time we need to polling, we have to display to the user
      // that the sync will be in a moment
      if (!attrs.run_at || (new Date(attrs.run_at) <= new Date())) {
        attrs.run_at = this._TEXTS.few_moments;
      } else {
        attrs.run_at = moment(attrs.run_at).fromNow();
      }

      // Can table be synced?
      attrs.canSync = this._canTableSyncNow() ? true : false ;

      // Come from external source?
      attrs.fromExternalSource = this.model.get("from_external_source");

      // Render
      this.$el
        .html(this.template(attrs))
        .attr('class', '')
        .addClass(attrs.state + ' ' + this.className);

      // Tipsy?
      this.$(".sync_now_disabled").tipsy({
        gravity:  's',
        fade:     true,
        title: function() {
          return _.template(self._TEXTS.sync_now_disabled)({ gap: self._SYNC_GAP })
        }
      });

      return this;
    },

    _bindEvents: function() {
      this.model.bind('change:state', this._onStateChange, this);
    },

    _unbindEvents: function() {
      this.model.unbind('change:state', this._onStateChange, this)
    },

    // Helpers

    _canTableSyncNow: function() {
      var ran_at = new Date(this.model.get('ran_at'));
      var now = new Date();
      var state = this.model.get('state');
      var gap = this._SYNC_GAP*60*1000;   // Importer needs some time to perform the next sync,
                                          // set 15 min as default.

      // If table is syncing... false!
      if (state === "syncing") {
        return false
      }

      if (( now.getTime() - ran_at.getTime() ) > gap) {
        return true;
      } else {
        return false;
      }
    },

    _isSyncing: function() {
      return this.model.get('state') === "syncing";
    },


    // UI bind events //

    _onClickSyncNow: function(e) {
      if (e) this.killEvent(e);

      if (this._canTableSyncNow()) {
        // Set syncing state
        this.model.set('state', 'syncing');
        // Show dialog
        this._showSyncNow();
        // Enqueue synchronization
        this.model.syncNow(this._startSync);
      }
    },

    _onClickOptions: function(e) {
      if (e) this.killEvent(e);
      var dialog = new cdb.editor.SyncView({
        clean_on_hide: true,
        enter_to_confirm: true,
        table: this.table
      });
      dialog.appendToBody();
    },


    _startSync: function() {
      // Render again
      this.render();
      // Bind events
      this._bindEvents();
      // We MUST wait before start polling
      var self = this;
      _.delay(function() {
        self.model.pollCheck();
      }, (this._POLLING_GAP * 1000)); // polling gap * miliseconds
    },

    _finishSync: function() {
      this._unbindEvents();
      this.model.destroyCheck();
      this._hideSyncNow();

      // Reload table and map data
      this.dataLayer.invalidate();
      this.table.data().refresh();
    },

    _onStateChange: function() {
      this._finishSync();

      // Success state could be wrong if any error_code
      // or error_message appears in the model
      if (this.model.get('state') === "success" &&
          (this.model.get('error_code') || this.model.get('error_message'))
        ) {
        this.model.set('state', 'failure');
      }

      this.render();
    },


    // Show or hide sync now modal //

    _showSyncNow: function(e) {
      if (e) this.killEvent(e);

      var modal = cdb.editor.ViewFactory.createDialogByTemplate('common/templates/loading', {
        title: 'Your dataset is being synced…',
        quote: "This action will take some time. In the meantime the UI is disabled, but APIs will work as usual."
      }, { sticky: true }).render();
      this.sync_now = modal;
      modal.appendToBody();
    },

    _hideSyncNow: function() {
      if (this.sync_now) {
        this.sync_now.hide();
      }
    },


    _destroyTipsy: function() {
      // Remove tipsy
      if (this.$('.sync_now_disabled').data('tipsy')) {
        this.$('.sync_now_disabled')
          .unbind('mouseenter mouseleave')
          .data('tipsy').remove();
      }
    },

    clean: function() {
      this._destroyTipsy();
      cdb.core.View.prototype.clean.call(this);
    }

  })
