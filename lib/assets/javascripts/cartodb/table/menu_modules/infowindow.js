

  cdb.admin.mod = cdb.admin.mod || {};


  /**
   *  Infowindow module, allow to edit the infowindow appearance
   *  and the fields that will be shown
   */

  cdb.admin.mod.InfoWindow = cdb.core.View.extend({

    buttonClass: 'infowindow_mod',
    className: 'infowindow_panel',
    type: 'tool',

    events: {
      'click .menu li a': '_toggleTab'
    },

    initialize: function() {
      var self = this;
      this.selectedAll = true;
      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      //this.model.bind('remove:fields', this.renderSelectAll, this);
      //this.model.bind('add:fields', this.renderSelectAll, this);
      this.options.table.bind('change:schema', this.render, this);
      this.options.table.linkToInfowindow(this.model);
    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template({}));

      this.renderThemeCombo();
      this.help = new cdb.admin.mod.InfowindowHelp();

      this.help.bind("show", function() {
        this.$el.find(".panel_content").css({ top: "80px" });

        if (this.pane.activeTab == 'tab3') {
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
      this.$el.find(".menu .tip").css({ left: "32px" });

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

    _toggleTab: function(e) {
      this.killEvent(e);

      var action = $(e.target).attr("data-action");

      this.$el.find(".menu a").removeClass("selected");
      $(e.target).addClass("selected");
      this.pane.active(action);
    },

    renderThemeCombo: function() {
      var themes = new cdb.forms.Combo({
        property: 'template_name',
        extra: [
          ['light',             'table/views/infowindow_light'],
          ['dark',              'table/views/infowindow_dark'],
          ['header blue',       'table/views/infowindow_light_header_blue'],
          ['header green',      'table/views/infowindow_light_header_green'],
          ['header yellow',     'table/views/infowindow_light_header_yellow'],
          ['header orange',     'table/views/infowindow_light_header_orange'],
          ['image header',      'table/views/infowindow_header_with_image']
        ],
        model: this.model
      });

      this.$('.header').append(themes.render().el);

      this.addView(themes);
    },

    _setupTipsy: function() {
      var tipsyOptions = { gravity: 's', html: true, live: true, fade: true, title: function() { return $(this).attr("data-tipsy") }};

      this.$el.find(".menu a[data-action='fields'], .menu a[data-action='title']").tipsy(tipsyOptions);

      tipsyOptions.gravity = 'se';

      this.$el.find(".menu a[data-action='html']").tipsy(tipsyOptions);
    },

    _setupPane: function() {
      this._setupTipsy();

      this.pane = new cdb.ui.common.TabPane({
        el: this.$el.find(".pane")
      });

      this.pane.addTab('fields', new cdb.admin.mod.InfowindowFieldsPane({
        table: this.options.table,
        model: this.model
      }));

      this.pane.addTab('title', new cdb.admin.mod.InfowindowTitlePane({
        table: this.options.table,
        model: this.model
      }));

      this.pane.addTab('html', new cdb.admin.mod.InfowindowHTMLPane({
        table: this.options.table,
        model: this.model
      }));

      this.pane.bind('tabEnabled', this._onEnableTab, this);

      this.pane.active('fields');
    },

    _onEnableTab: function(tabName, tabView) {
      $('.tipsy:last').remove();

      if (tabName == 'html') {
        this.$el.find(".form_combo").hide();
      } else {
        this.$el.find(".form_combo").show();
      }

      if (tabName == 'fields') {
        this.$el.find(".header h3").text("Design");
      } else if (tabName == 'title') {
        this.$el.find(".header h3").text("Design");
      } else if (tabName == 'html') {
        this.$el.find(".header h3").text("Custom HTML");
      }

      if (tabName == 'html') {
        if (tabView.codeEditor) tabView.codeEditor.refresh();
        this.$el.addClass('editing_html');
        this.help.model.set("hidden", false);
      } else {
        this.$el.removeClass('editing_html');
        this.help.model.set("hidden", true);
      }

      var left = this.$el.find(".menu li a[data-action="+tabName+"]").parent().position().left;

      if (tabName == 'html') left += 6;
      else if (tabName == 'fields') left += 2;

      this.$el.find(".menu .tip").css({ left: left });
    }

  });