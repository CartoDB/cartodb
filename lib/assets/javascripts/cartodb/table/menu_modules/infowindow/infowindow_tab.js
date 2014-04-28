  
  /**
   *  Default infowindow tab pane.
   *
   *  - Used by: infowindow on click and infowindow on hover  
   */


  cdb.admin.mod.InfoWindowTab = cdb.core.View.extend({

    _THEMES: [
      ['light',         'infowindow_light'],
      ['dark',          'infowindow_dark'],
      ['header blue',   'infowindow_light_header_blue'],
      ['header green',  'infowindow_light_header_green'],
      ['header yellow', 'infowindow_light_header_yellow'],
      ['header orange', 'infowindow_light_header_orange'],
      ['image header',  'infowindow_header_with_image']
    ],

    _TEXTS: {
      title_tab: {
        enabled:  _t('Change title labels'),
        disabled: _t('No titles selected')
      }
    },

    events: {},

    initialize: function() {
      this.selectedAll = true;
      this.table = this.options.table;
      this.template = this.getTemplate('table/menu_modules/views/infowindow_tabs');
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template({}));

      this.renderThemeCombo();
      this._setupPane();

      return this;
    },

    _initBinds: function() {
      this.table.bind('change:schema', this._onFieldsChange, this);
      this.table.linkToInfowindow(this.model);
      this.add_related_model(this.table);

      this.model.bind('change:template',  this._onChangeTemplate, this);
      this.model.bind('change:fields',    this._onFieldsChange,   this);

      cdb.god.bind("end_show", this._refreshHTMLEditor, this); 
      this.add_related_model(cdb.god);
    },

    renderThemeCombo: function() {
      this.themes = new cdb.forms.Combo({
        property: 'template_name',
        extra: this._THEMES,
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

    getActiveTab: function() {
      return this.infowindow_panes && this.infowindow_panes.activeTab;
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
      this.trigger('tabChanged', this);
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

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    }

  });