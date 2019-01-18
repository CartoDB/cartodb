
/* Widget for the Share Dialog */

cdb.admin.mod.LegendWidget = cdb.core.View.extend({

  className: "cartodb-legends",

  initialize: function() {

    this.map = this.options.map;
    this._setupTemplates();

    this.map.layers.bind("change", this.render, this);

  },

  _setupTemplates: function() {

    this.template = _.template('<%- count %> active legend<%- (count == 1) ? "" : "s" %>');

  },

  _getLegends: function() {

    var self = this;

    var legends = [];

    _.each(this.map.layers.models, function(layer) {

      if (layer.get("type") == 'layergroup') {

        var layerGroupView = self.mapView.getLayerByCid(layer.cid);

        for (var i = 0 ; i < layerGroupView.getLayerCount(); ++i) {
          var l = layerGroupView.getLayer(i);

          legends.push(new cdb.geo.ui.Legend({
            type: l.legend.get("type"),
            data: l.legend.items.toJSON()
          }));

        }

      } else if (layer.get("type") === "CartoDB" || layer.get("type") === "torque") {

        legends.push(new cdb.geo.ui.Legend({
          type: layer.legend.get("type"),
          data: layer.legend.items.toJSON()
        }));

      }

    });

    return legends;
  },

  _getLegendsCount: function() {

    var count = 0;

    _.each(this.map.layers.models, function(layer) {

      if (layer.get("type") == 'layergroup') {

        var layerGroupView = this.mapView.getLayerByCid(layer.cid);

        for (var i = 0 ; i < layerGroupView.getLayerCount(); ++i) {

          var l = layerGroupView.getLayer(i);

          if (l.legend.items.length > 0 && l.get("visible") && l.legend.get("type") != null) {
              count++;
            }
          }

        } else if ((layer.get("type") === "CartoDB" || layer.get("type") === "torque") && layer.get("visible") && layer.legend.get("type") != null) {

          if (layer.legend.items.length > 0 || layer.legend.get("template")) {
            count++;
          }

        }

      }, this);

      return count;
    },

  render: function() {

    this.$el.html(this.template({ count: this._getLegendsCount() }));

    return this;

  }

});



cdb.admin.mod.LegendEditorCollection = Backbone.Collection.extend({ });

cdb.admin.mod.LegendEditorItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click .title": "_onClickTitle",
    "click .sync": "_onClickSync",
    "click .remove": "_removeItem"

  },

  initialize: function() {

    _.bindAll(this, "_onChangeTitle", "_onToggleShowTitle", "_onToggleSync");

    this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('table/menu_modules/legends/views/legend_item');

    this.add_related_model(this.model);

    this.removable   = this.options.removable === undefined ? true : false;
    this.title       = this.options.title === undefined ? "" : this.options.title;
    this.showSwitch  = this.options.showSwitch === undefined ? "" : this.options.showSwitch;

    this.model.bind("change:title", this._onChangeTitle);
    this.model.bind("change:show_title", this._onToggleShowTitle);
    this.model.bind("change:sync", this._onToggleSync);

  },

  render: function() {
    var values = _.extend( this.model.toJSON(), { title: this.title, sync: this.model.get("sync"), show_switch: this.showSwitch, removable: this.removable });
    this.$el.append(this.template(values));

    this._addEditInPlace();

    if (!this.title) this._addColorForm();

    return this;
  },

  _onToggleSync:function() {

    if (this.model.get("sync")) this.$el.find(".checkbox.sync").addClass("enabled");
    else this.$el.find(".checkbox.sync").removeClass("enabled");

  },

  _onChangeTitle:function() {

    if (this.model.get("title") && !this.model.get("show_title")) this.model.set("show_title", true);
    else if (!this.model.get("title") && this.model.get("show_title")) this.model.set("show_title", false);

  },

  _onToggleShowTitle:function() {

    if (this.model.get("show_title")) this.$el.find(".title").addClass("enabled");
    else this.$el.find(".title").removeClass("enabled");

  },

  _onClickSync: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.model.set("sync", !this.model.get("sync"));

  },

  _onClickTitle: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.model.set("show_title", !this.model.get("show_title"));
  },

  _removeItem: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.trigger('remove', this);

  },

  _addEditInPlace: function() {
    var self = this;

    this.editInPlace = new cdb.admin.EditInPlace({
      observe: this.options.observe,
      model: this.model,
      maxWidth: this.options.maxWidth,
      stripHTML: true,
      el: this.$el.find(".input")
    });

    // Set custom_value to true if value was added
    // manually
    this.editInPlace.bind("change", function(val) {
      if (this.model.get('name') == "Left label" || this.model.get('name') == "Right label") {
        this.model.set('custom_value', true);
      }
    })

    this.addView(this.editInPlace);

  },

  _addColorForm: function() {

    if (this.options.filter_type == 'category' || this.options.filter_type == 'color' || this.options.filter_type == 'custom' || this.options.filter_type == 'choropleth') {

      var self = this;

      // Generate a temp model for the color/file
      var tempModel = new cdb.core.Model();

      var value  = this.model.get("value") || "";
      var hasURL = value.toString().indexOf("http") !== -1;
      var color  = hasURL ? "" : value;
      var file   = hasURL ? value : "";

      tempModel.set({ color: color, file: file });

      // Bind it to our item
      tempModel.bind("change:color change:file", function(model) {
        var changed =  model.changed.color || model.changed.file;

        if (changed) {
          self.model.set("value", changed);
        }

      });

      this.colorForm = new cdb.forms.Color({
        model: tempModel,
        property: 'color',
        extra_colors: this.options.extra_colors,
        extra: {
          image_property: 'file'
        }
      });

    } else {
      this.colorForm = new cdb.forms.Color({
        model: this.model,
        property: 'value',
        extra_colors: this.options.extra_colors
      });
    }

    this.$el.find('span.field').append(this.colorForm.render().el);
    this.addView(this.colorForm);

  }

});

cdb.admin.mod.LegendEditor = cdb.admin.Module.extend({

    type: 'tool',
    buttonClass: 'legends_mod',
    className: 'legends_panel',

    events: {
      "click .reset": "_onResetClick"
    },

    initialize: function() {

      this.template = this.getTemplate('table/menu_modules/legends/views/legends');
      this.model.bind("change:template", this._onChangeTemplate, this);

      cdb.god.bind("end_show", this._refreshHTMLEditor, this);

    },

    clean: function() {
      cdb.god.unbind("end_show", this._refreshHTMLEditor, this);
      cdb.admin.Module.prototype.clean.call(this);
    },

    getModuleAction: function() {
      var active_tab = this.legend_panes.activeTab;
      var action = this._ACTION;

      if (active_tab == "html") {
        action = {
          type: "show",
          width: 600
        }
      }

      return action;
    },

    _onResetClick: function(e) {

      this.killEvent(e);

      // Restore template_name if exists, reset old_template_name and reset template
      this.model.set({ template: "" });
      var field = this.legend_panes.getPane("fields");

      if (field.currentLegendPane && field.currentLegendPane.wizardProperties) {
        var type = field.currentLegendPane.wizardProperties.get('type');

        if (type != "polygon") this.model.set({ type: type });
        else this.model.set({type: "none"})

      }

      // Send trigger
      this.trigger('reset', this);

    },

    _setupLegendPane: function() {
      this._setupTipsy();

      this.legend_tabs = new cdb.admin.Tabs({
        el: this.$('.menu ul'),
        slash: true
      });

      this.addView(this.legend_tabs);

      this.legend_panes = new cdb.ui.common.TabPane({
        el: this.$(".pane")
      });

      this.addView(this.legend_panes);

      this.legend_panes.addTab('fields', new cdb.admin.mod.LegendFieldsPane({
        table: this.options.table,
        dataLayer: this.options.dataLayer,
        availableLegends: this.options.availableLegends,
        model: this.model
      }));

      this.legend_panes.addTab('html', new cdb.admin.mod.LegendHTMLPane({
        table: this.options.table,
        model: this.model
      }));

      this.legend_tabs.linkToPanel(this.legend_panes);

      var active_tab = 'fields';
      if (this.model.get('template')) active_tab = 'html';

      this._activePane(active_tab, this.legend_panes.getPane(active_tab));
      this.legend_panes.active(active_tab);
      this.legend_tabs.activate(active_tab);

      this.legend_panes.bind('tabEnabled', this._onEnableTab, this);
    },

    _setupTipsy: function() {
      var options = {
        html: true,
        live: true,
        fade: true
      }

      // Tipsy: Toggle fields and titles
      options.el = this.$(".menu a[href='#/fields']");
      options.gravity = 's'
      var toggleFieldstooltip = new cdb.common.TipsyTooltip(options)
      this.addView(toggleFieldstooltip);

      // Tipsy: Change HTML
      options.el = this.$(".menu a[href='#/html']");
      options.gravity = 'se'
      var changeHTMLTooltip = new cdb.common.TipsyTooltip(options)
      this.addView(changeHTMLTooltip);
    },

    _toggleContent: function() {
      if (this.model.get("template")) {
        this.$el.addClass('disabled');
        this.$(".blocked").show();
      } else {
        this.$el.removeClass('disabled');
        this.$(".blocked").hide();
      }
    },

    _onEnableTab: function(tabName, tabView) {
      this._activePane(tabName, tabView);

      // Send signal to know that active tab has changed
      this.triggerModuleAction();
    },

    _onChangeTemplate: function() {
      this._activePane(
        this.legend_panes.activeTab,
        this.legend_panes.getActivePane()
      );
    },

    _activePane: function(tabName, tabView) {
      $('.tipsy:last').remove();

      if (tabName == 'html') {
        this.$(".form_combo").hide();
      } else {
        this.$(".form_combo").show();
      }

      if (tabName == 'fields') {
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

      this.$(".menu .tip").css(horiz_pos);
    },

    setActiveTab: function(tabName) {
      this.legend_panes.active(tabName);
      this.legend_tabs.activate(tabName);
    },

    _refreshHTMLEditor: function() {
      if (this.legend_panes && this.legend_panes.activeTab == "html") {
        var pane = this.legend_panes.getPane('html');
        if (pane && pane.codeEditor) {
          pane.codeEditor.refresh();
          pane.adjustCodeEditorSize();
        }
      }
    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template);

      this._toggleContent();
      this._setupLegendPane();

      return this;
    }

});

/**
 * NoneLegend
 */
cdb.admin.mod.NoneLegend = cdb.core.View.extend({

  _FILTER_NAME: "none",

  initialize: function() {

    this._setupTemplates();
    this.render();

  },

  _setupTemplates: function() {

    this.template           = this.getTemplate('table/menu_modules/legends/views/none_legend_pane');

  },

  _calculateItems: function() {

  },

  refresh: function() {

  },

  render: function() {
    this.clearSubViews();

    this.$el.html(this.template);
    this.$el.find(".no_content").show();

    return this;
  }

});

/**
 * CustomLegend
 */
cdb.admin.mod.CustomLegend = cdb.core.View.extend({

  _FILTER_NAME: "custom",

  events: {

    "click .add":    "_addItem"

  },

  initialize: function() {

    this._setupTemplates();
    this.wizardProperties = this.options.wizardProperties;

    this.legendItems = [];

    this.items = this.model.items;

  },

  _setupTemplates: function() {

    this.template           = this.getTemplate('table/menu_modules/legends/views/custom_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'

  },

  refresh: function() { },

  _calculateItems: function() { },

  _addItem: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var item = new cdb.geo.ui.LegendItemModel({ name: "Untitled", value: "#cccccc", sync: true });

    this.items.add(item);

  },

  _renderItems: function() {

    this.legendItems = [];

    if (this.items.length > 0) {
      this.$el.find(".no_content").hide();
      this.items.each(this._renderItem, this);
      this.titleEditor.show();
    } else {
      this.$el.find(".no_content").show();
      this.titleEditor.hide();
    }

  },

  _renderItem: function(item) {

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "name",
      filter_type: this._FILTER_NAME,
      template_name: this.item_template_name,
      extra_colors: this.options.extra_colors
    });

    view.bind("remove", this._removeItem, this);

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
    this.legendItems.push(view);

  },

  _removeItem: function(item) {
    this.items.remove(item.model);
  },

  render: function() {

    this.clearSubViews();

    this.titleEditor = new cdb.admin.mod.LegendEditorItem({
      className: "title",
      model: this.model,
      observe: "title",
      title: "Title",
      maxWidth: 120,
      showSwitch: true,
      removable: false,
      template_name: 'table/menu_modules/legends/views/custom_legend_item'
    });

    this.$el.html(this.template);

    this.$el.find("ul").append(this.titleEditor.render().$el);
    this.addView(this.titleEditor);

    this._renderItems();

    return this;
  }

});
