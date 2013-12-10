

  cdb.admin.mod = cdb.admin.mod || {};


  /**
   *  Infowindow module, allow to edit the infowindow appearance
   *  and the fields that will be shown
   */

  cdb.admin.mod.InfoWindow = cdb.admin.Module.extend({

    _TEXTS: {
      title_tab: {
        enabled:  _t('Change title labels'),
        disabled: _t('No titles selected')
      }
    },

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

      this.options.table.bind('change:schema', this._onFieldsChange, this);
      this.options.table.linkToInfowindow(this.model);
      this.add_related_model(this.options.table);

      this.model.bind('change:template',  this._onChangeTemplate, this);
      this.model.bind('change:fields',    this._onFieldsChange,   this);

      cdb.god.bind("end_show", this._refreshHTMLEditor, this);
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template({}));

      this.renderThemeCombo();
      this._setupPane();

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
      this.model.set('disabled', true);
    },

    enabled: function() {
      this.model.unset('disabled');
    },

    renderThemeCombo: function() {
      this.themes = new cdb.forms.Combo({
        property: 'template_name',
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
    },

    _setupTipsy: function() {
      var tipsyOptions = { gravity: 's', html: true, live: true, fade: true, title: function() { return $(this).attr("data-tipsy") }};

      this.$(".menu a[href]:not([href='#/html'])").tipsy(tipsyOptions);

      tipsyOptions.gravity = 'se';

      this.$(".menu a[href='#/html']").tipsy(tipsyOptions);
    },

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

      this.infowindow_panes.addTab('html', new cdb.admin.mod.InfowindowHTMLPane({
        table: this.options.table,
        model: this.model
      }));

      this.infowindow_tabs.linkToPanel(this.infowindow_panes);

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
        this.$(".form_combo").hide();
        this.$(".doc_info").show();
      } else {
        this.$(".form_combo").show();
        this.$(".doc_info").hide();
      }

      if (tabName == 'fields') {
        this.$(".header h3").text("Design");
      } else if (tabName == 'title') {
        this.$(".header h3").text("Design");
      } else if (tabName == 'html') {
        this.$(".header h3").text("Custom HTML");
      }

      if (tabName == 'html') {
        this._refreshHTMLEditor();
        this.$el.addClass('editing_html editor');
      } else {
        this.$el.removeClass('editing_html editor');
      }

      if (this.model.get('template') && tabName !== 'html') {
        this.$('.header .blocked').show();
      } else {
        this.$('.header .blocked').hide();
      }

      var horiz_pos = { left: 32, right: 'auto' };

      if (tabName == 'html') horiz_pos = { right:29, left:'auto' };
      else if (tabName == 'title') horiz_pos = { right:68, left:'auto' };

      this.$(".menu .tip").css(horiz_pos);
    },

    setActiveTab: function(tabName) {
      this.infowindow_panes.active(tabName);
      this.infowindow_tabs.activate(tabName);
    },

    _onEnableTab: function(tabName, tabView) {
      this._activePane(tabName, tabView);

      // Send signal to know that active tab has changed
      this.triggerModuleAction();
    },

    // Disable title pane when all fields are unselected
    _onFieldsChange: function(m) {
      var fields = _.filter(this.model.get('fields'), function(f) { return f.title });
      var columns = this.getColumnNames();
      var $tab = this.infowindow_tabs.getTab('title');

      if (fields.length == 0 || columns.length == 0) {
        this.infowindow_panes.removeTab('title');
        this.infowindow_tabs.disable('title');
        $tab.attr('data-tipsy', this._TEXTS.title_tab.disabled);
        
      } else if (!this.infowindow_panes.getPane('title')) {
        
        this.infowindow_panes.addTab('title', new cdb.admin.mod.InfowindowTitlePane({
          table:        this.options.table,
          model:        this.model,
          fields_pane:  this.fields_pane
        }), { active: false });

        this.infowindow_tabs.enable('title');
        $tab.attr('data-tipsy', this._TEXTS.title_tab.enabled);
      }
    },

    _onChangeTemplate: function() {
      this._activePane(
        this.infowindow_panes.activeTab,
        this.infowindow_panes.getActivePane()
      );
    },

    _refreshHTMLEditor: function() {
      if (this.infowindow_panes && this.infowindow_panes.activeTab == "html") {
        var pane = this.infowindow_panes.getPane('html');
        if (pane && pane.codeEditor) {
          pane.codeEditor.refresh();
          pane.adjustCodeEditorSize();
        }
      }
    },

    _showMustacheHelp: function(e) {
      this.killEvent(e);
      var dlg = new cdb.admin.MustacheInfo();
      dlg.appendToBody().open();
    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    clean: function() {
      cdb.god.unbind("end_show", this._refreshHTMLEditor, this); 
      cdb.admin.Module.prototype.clean.call(this);
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
