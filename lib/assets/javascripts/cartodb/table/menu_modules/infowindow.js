

  cdb.admin.mod = cdb.admin.mod || {};


  /**
   *  Infowindow module, allow to edit the infowindow appearance
   *  and the fields that will be shown
   */

  cdb.admin.mod.InfoWindow = cdb.admin.Module.extend({

    buttonClass: 'infowindow_mod',
    className: 'infowindow_panel',
    type: 'tool',

    events: {
      'click a.doc_info': '_showMustacheHelp'
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      this.dataLayer = this.options.dataLayer;
      this.user = this.options.user;
      this.table = this.options.table;
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template());
      this._renderContent();
      return this;
    },

    _renderContent: function() {
      // Infowindow tabs
      this.infowindow_tabs = new cdb.admin.Tabs({
        el: this.$('ul.types'),
        slash: true
      });
      this.addView(this.infowindow_tabs);

      // Infowindow panes
      this.infowindow_panes = new cdb.ui.common.TabPane({
        el: this.$(".panes_content")
      });

      this.addView(this.infowindow_panes);

      this.tooltip_pane = new cdb.admin.mod.TooltipTab({
        table: this.table,
        model: this.dataLayer.tooltip
      }).render();
      this.tooltip_pane.bind('tabChanged', this._onEnableTab, this);
      this.infowindow_panes.addTab('tooltip', this.tooltip_pane);

      this.infowindow_pane = new cdb.admin.mod.InfoWindowTab({
        table: this.table,
        model: this.dataLayer.infowindow
      }).render()
      this.infowindow_pane.bind('tabChanged', this._onEnableTab, this);
      this.infowindow_panes.addTab('infowindow', this.infowindow_pane);

      this.infowindow_tabs.linkToPanel(this.infowindow_panes);

      this.infowindow_panes.active('infowindow');
      this.infowindow_tabs.activate('infowindow');

      this.infowindow_panes.bind('tabEnabled', this._onEnableTab, this);
    },

    getModuleAction: function() {
      var active_tab = this.infowindow_panes.activePane.getActiveTab();
      var action = this._ACTION;

      if (active_tab == "html") {
        action = {
          type: "show",
          width: 600
        }
      }

      return action;
    },

    _onEnableTab: function() {
      this.triggerModuleAction();
    },

    activated: function() {},
    disabled: function() {},
    enabled: function() {},

    _showMustacheHelp: function(e) {
      this.killEvent(e);
      var dlg;
      if (this.user.featureEnabled('new_modals')) {
        dlg = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/mustache_template_info');
      } else {
        dlg = new cdb.admin.MustacheInfo();
      }

      dlg.appendToBody().open();
    },

    setActiveTab: function(tabName) {
      this.infowindow_panes.active(tabName);
    }

  });



  // - Map for getting the new template name.
  // - It keeps retro-compatibility with old
  //   template urls in template name attribute.
  cdb.admin.mod.TemplateMap = {
    'table/views/infowindow_light':               'infowindow_light',
    'table/views/infowindow_dark':                'infowindow_dark',
    'table/views/infowindow_light_header_blue':   'infowindow_light_header_blue',
    'table/views/infowindow_light_header_yellow': 'infowindow_light_header_yellow',
    'table/views/infowindow_light_header_orange': 'infowindow_light_header_orange',
    'table/views/infowindow_light_header_green':  'infowindow_light_header_green',
    'table/views/infowindow_header_with_image':   'infowindow_header_with_image'
  }
