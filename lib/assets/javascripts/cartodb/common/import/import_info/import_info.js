
  /**
   *  Import info module
   *  
   *  It could represent upload errors,
   *  upload syncing, upload warnings...
   *
   *  - It needs a ImportPaneModel model from the parent panel
   *    to make it work.
   *  - It will listen to any 'value' (model attribute) change
   *    to show up any message.
   *  - It creates a tabpane adding the different modules to
   *    show up.
   *  - If acceptSync option is not defined, sync modules (sync
   *    and no-sync) won't be available.
   *
   *
   *  new cdb.admin.ImportInfo({
   *    model: new cdb.admin.ImportPaneModel(),
   *    acceptSync: true
   *  })
   *
   */

  cdb.admin.ImportInfo = cdb.core.View.extend({

    _TEXTS: {
      upgrade:  _t('To mantain your data in sync with the source \
                        <a href="#/showUpgrade">upgrade your plan</a>.'),
      xls_tip:  _t('XLS files take longer than CSV files. Export it as \
                    CSV from Excel to import faster!'),
      zip_tip:  _t('Did you know you can upload compressed files? \
                    They will import faster!')
    },

    initialize: function() {
      this._initPanes();

      this.model.bind('change:value', this._onChangeValue, this);
    },

    render: function() {},

    _initPanes: function() {
      // Import tips
      this.importXLSTip = new cdb.admin.ImportInfo.Message({
        className:  'info tips xls-tips',
        msg:        this._TEXTS.xls_tip
      });

      this.importZipTip = new cdb.admin.ImportInfo.Message({
        className:  'info tips zip-tips',
        msg:        this._TEXTS.zip_tip
      });

      // Sync pane
      this.syncPane = new cdb.admin.ImportInfo.Sync();
      this.syncPane.bind('periodChange', this._updatePeriod, this);

      // Sync disabled pane
      this.syncDisabledPane = new cdb.admin.ImportInfo.Message({
        className:  'info no-sync',
        msg:        this._TEXTS.upgrade
      });
      this.syncDisabledPane.bind('showUpgrade', this._triggerUpgrade, this);

      // Error pane
      this.errorPane = new cdb.admin.ImportInfo.Message({
        className: 'info error'
      });
      this.errorPane.bind('showUpgrade', this._triggerUpgrade, this);

      // Create TabPane
      this.panes = new cdb.ui.common.TabPane({
        el: this.$el
      });

      this.panes.addTab('xls',            this.importXLSTip);
      this.panes.addTab('zip',            this.importZipTip);
      this.panes.addTab('sync',           this.syncPane);
      this.panes.addTab('sync_disabled',  this.syncDisabledPane);
      this.panes.addTab('error',          this.errorPane);

      this.panes.bind('tabEnabled',   this._showTab, this);
      this.panes.bind('tabDisabled',  this._hideTab, this);
      
      this.addView(this.panes);
      this.$el.append(this.panes.render());
    },

    _onChangeValue: function() {
      var val = this.model.get('value');
      var pane = this.panes.activePane;

      if (!val) {
        this._hideTab();
      } else if (cdb.Utils.isURL(val) && this.options.acceptSync !== undefined) {
        
        if (this.options.acceptSync) {
          // If user can sync their tables
          this.activeTab('sync')
        } else {

          // If not, we check files extension
          // Check extension
          var patt = /\.[0-9a-z]+$/i;
          var mat = val.match(patt);

          if (mat) {
            var ext = mat[0].toLowerCase();

            // Is that extension valid?
            var isValid = _.contains(this.options.fileTypes, ext.replace('.',''));

            if (isValid) {
              // Excel?
              if (ext === ".xls" || ext === ".xlsx") {
                this.activeTab('xls');
                return false;
              }

              // Not compressed?
              var compressed_exts = [".zip", ".tar", ".gz", ".tgz", ".bz2"];

              if (!_.contains(compressed_exts, ext)) {
                this.activeTab('zip');
                return false;
              }
            }
          }

          // Go upgrade man!
          this.activeTab('sync_disabled');
        }
        
      } else {
        this._hideTab();
      }
    },

    activeTab: function(tabName, msg) {
      // Set message
      var pane = this.panes.getPane(tabName);
      if (msg) pane.setMessage(msg);

      if (this.panes.activeTab == tabName) {
        this._showTab();        
      } else {
        this.panes.active(tabName);
      }
    },

    hideTab: function() {
      var pane = this.panes.activePane;
      setTimeout( function(){
        pane.$el.removeClass('active');
      }, 50);
    },

    _showTab: function() {
      var pane = this.panes.activePane;
      setTimeout( function(){
        pane.$el.addClass('active');
      }, 50);
    },

    _hideTab: function() {
      var pane = this.panes.activePane;
      this.panes.activePane.$el.removeClass('active');
      setTimeout( function() {
        pane.reset();
      }, 500)
    },

    _updatePeriod: function(interval) {
      this.model.set('interval', interval)
    },

    _triggerUpgrade: function() {
      this.trigger('showUpgrade');
    }

  });