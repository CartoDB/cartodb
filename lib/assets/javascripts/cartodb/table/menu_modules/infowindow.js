

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
      var self = this;
      this.selectedAll = true;

      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      this.options.table.bind('change:schema', this.render, this);
      this.options.table.linkToInfowindow(this.model);

      this.add_related_model(this.options.table);

      cdb.god.bind("end_show", this._refreshHTMLEditor, this);
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template({}));

      this.renderThemeCombo();
      this.help = new cdb.admin.mod.InfowindowHelp();

      this.help.bind("show", function() {
        this.$el.find(".panel_content").css({ top: "80px" });

        if (this.infowindow_panes.activeTab == 'html') {
          this.help.$el.addClass("editing_html");
        } else {
          this.help.$el.removeClass("editing_html");
        }
        this.$el.find(".tip").addClass("_help");
      }, this);

      this.help.bind("hide", function() {
        this.$el.find(".panel_content").css({ top: "61px" });
          this.$el.find(".tip").removeClass("_help");
      }, this);

      this._setupPane();
      this.$el.find(".menu").append(this.help.render().$el);

      if (this.custom_scroll) { // Remove old custom scroll
        this.removeView(this.custom_scroll);
        this.custom_scroll.clean();
      }

      // Create custom scroll
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     this.$el.find(".panel_content div.wrapper"),
        parent: this.$el.find(".panel_content")
      });

      this.addView(this.custom_scroll);

      return this;
    },

    getModuleAction: function() {
      var active_tab = this.infowindow_panes.activeTab;
      var action = this._ACTION;

      if (active_tab == "html") {
        action = {
          type: "show",
          width: 600
        }
      }

      return action;
    },

    activated: function() {},

    disabled: function() {
      this.model.saveFields();
      this.model.clearFields();
      this.model.set('disabled', true);
    },

    enabled: function() {
      this.model.restoreFields();
      this.model.unset('disabled');
    },

    renderThemeCombo: function() {
      this.themes = new cdb.forms.Combo({
        property: 'template_name',
        disabled: this.model.get('template'),
        extra: [
          ['light',         'infowindow_light'],
          ['dark',          'infowindow_dark'],
          ['header blue',   'infowindow_light_header_blue'],
          ['header green',  'infowindow_light_header_green'],
          ['header yellow', 'infowindow_light_header_yellow'],
          ['header orange', 'infowindow_light_header_orange'],
          ['image header',  'infowindow_header_with_image']
        ],
        model: this.model
      });

      this.$('.header').append(this.themes.render().el);

      this.addView(this.themes);

      // Check if custom html is applied and disabled the themes combo
      this.model.unbind('change:template', this._setupThemesCombo, this);
      this.model.bind('change:template', this._setupThemesCombo, this);
    },

    _setupThemesCombo: function() {
      if (this.model.get('template')) {
        this.themes.$('select').select2("disable");
      } else {
        this.themes.$('select').select2("enable");
      }
    },

    _setupTipsy: function() {
      var tipsyOptions = { gravity: 's', html: true, live: true, fade: true, title: function() { return $(this).attr("data-tipsy") }};

      this.$el.find(".menu a[data-action='fields'], .menu a[data-action='title']").tipsy(tipsyOptions);

      tipsyOptions.gravity = 'se';

      this.$el.find(".menu a[data-action='html']").tipsy(tipsyOptions);
    },

    _setupPane: function() {
      this._setupTipsy();

      // Infowindow tabs
      this.infowindow_tabs = new cdb.admin.Tabs({
        el: this.$('.menu ul'),
        slash: true
      });

      // Infowindow panes
      this.infowindow_panes = new cdb.ui.common.TabPane({
        el: this.$el.find(".pane")
      });

      this.infowindow_panes.addTab('fields', new cdb.admin.mod.InfowindowFieldsPane({
        table: this.options.table,
        model: this.model
      }));

      this.infowindow_panes.addTab('title', new cdb.admin.mod.InfowindowTitlePane({
        table: this.options.table,
        model: this.model
      }));

      this.infowindow_panes.addTab('html', new cdb.admin.mod.InfowindowHTMLPane({
        table: this.options.table,
        model: this.model
      }));

      this.infowindow_tabs.linkToPanel(this.infowindow_panes);
      this.addView(this.infowindow_panes);

      // If custom html is applied, let's select that tab
      var active_tab = 'fields';
      if (this.model.get('template')) active_tab = 'html';

      this._activePane(active_tab, this.infowindow_panes.getPane(active_tab));
      this.infowindow_panes.active(active_tab);
      this.infowindow_tabs.activate(active_tab);

      this.infowindow_panes.bind('tabEnabled', this._onEnableTab, this);
    },

    _activePane: function(tabName, tabView) {
      $('.tipsy:last').remove();

      if (tabName == 'html') {
        this.$el.find(".form_combo").hide();
        this.$el.find(".docs_info").show();
      } else {
        this.$el.find(".form_combo").show();
        this.$el.find(".docs_info").hide();
      }

      if (tabName == 'fields') {
        this.$el.find(".header h3").text("Design");
      } else if (tabName == 'title') {
        this.$el.find(".header h3").text("Design");
      } else if (tabName == 'html') {
        this.$el.find(".header h3").text("Custom HTML");
      }

      if (tabName == 'html') {
        this._refreshHTMLEditor();
        this.$el.addClass('editing_html');
        this.help.model.set("hidden", false);
      } else {
        this.$el.removeClass('editing_html');
        this.help.model.set("hidden", true);
      }

      var horiz_pos = { left: 32, right: 'auto' };

      if (tabName == 'html') horiz_pos = { right:29, left:'auto' };
      else if (tabName == 'title') horiz_pos = { right:68, left:'auto' };

      this.$el.find(".menu .tip").css(horiz_pos);
    },

    _onEnableTab: function(tabName, tabView) {
      this._activePane(tabName, tabView);

      // Send signal to know that active tab has changed
      this.triggerModuleAction();
    },

    _refreshHTMLEditor: function() {
      if (this.infowindow_panes && this.infowindow_panes.activeTab == "html") {
        var pane = this.infowindow_panes.getPane('html');
        if (pane && pane.codeEditor) pane.codeEditor.refresh();  
      }
    },

    _showMustacheHelp: function(e) {
      this.killEvent(e);
      var dlg = new cdb.admin.MustacheInfo();
      dlg.appendToBody().open();
    },

    clean: function() {
      cdb.god.unbind("end_show", this._refreshHTMLEditor, this); 
      cdb.admin.Module.prototype.clean.call(this);
    }

  });



  // * Map for getting the new template name.
  // * It keeps retro-compatibility with old 
  // template urls in template name attribute.
  cdb.admin.mod.TemplateMap = {
    'table/views/infowindow_light':               'infowindow_light',
    'table/views/infowindow_dark':                'infowindow_dark',
    'table/views/infowindow_light_header_blue':   'infowindow_light_header_blue',
    'table/views/infowindow_light_header_yellow': 'infowindow_light_header_yellow',
    'table/views/infowindow_light_header_orange': 'infowindow_light_header_orange',
    'table/views/infowindow_light_header_green':  'infowindow_light_header_green',
    'table/views/infowindow_header_with_image':   'infowindow_header_with_image'
  }
