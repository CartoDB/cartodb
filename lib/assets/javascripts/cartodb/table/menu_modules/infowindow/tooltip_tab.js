
  /**
   *  Tooltip tab pane
   *
   *  - Extending infowindow tab.
   */

  cdb.admin.mod.TooltipTab = cdb.admin.mod.InfoWindowTab.extend({

    _THEMES: [
      ['light', 'infowindow_light']
    ],

    _setupPane: function() {
      this._setupTipsy();

      // Infowindow tabs
      this.infowindow_tabs = new cdb.admin.Tabs({
        el: this.$('.menu ul'),
        slash: true
      });
      this.addView(this.infowindow_tabs);

      // Infowindow panes
      this.infowindow_panes = new cdb.ui.common.TabPane({
        el: this.$(".pane")
      });
      this.addView(this.infowindow_panes);

      this.fields_pane = new cdb.admin.mod.InfowindowFieldsPane({
        table: this.options.table,
        model: this.model
      });
      this.infowindow_panes.addTab('fields', this.fields_pane);

      this.infowindow_panes.addTab('title', new cdb.admin.mod.InfowindowTitlePane({
        table:        this.options.table,
        model:        this.model,
        fields_pane:  this.fields_pane
      }));

      // this.infowindow_panes.addTab('html', new cdb.admin.mod.InfowindowHTMLPane({
      //   table: this.options.table,
      //   model: this.model
      // }));

      this.infowindow_tabs.linkToPanel(this.infowindow_panes);

      // If custom html is applied, let's select that tab
      var active_tab = 'fields';
      if (this.model.get('template')) active_tab = 'html';

      this._activePane(active_tab, this.infowindow_panes.getPane(active_tab));
      this.infowindow_panes.active(active_tab);
      this.infowindow_tabs.activate(active_tab);

      this.infowindow_panes.bind('tabEnabled', this._onEnableTab, this);
    }

  })