cdb.admin.mod.LegendEditorCollection = Backbone.Collection.extend({ });

cdb.admin.mod.LegendEditorItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    "click .remove": "_removeItem"

  },

  initialize: function() {

    this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('table/menu_modules/legends/views/legend_item');
    this.add_related_model(this.model);
  },

  render: function() {

    this.$el.append(this.template(this.model.toJSON()));

    this._addEditInPlace();
    this._addColorForm();

    return this;
  },

  _removeItem: function(e) {
    e.preventDefault();
    e.stopPropagation();

    this.trigger('remove', this);

  },

  _addEditInPlace: function() {

    this.editInPlace = new cdb.admin.EditInPlace({
      observe: this.options.observe,
      model: this.model,
      el: this.$el.find(".input")
    });

    this.addView(this.editInPlace);

  },

  _addColorForm: function() {


    var colors = [ "#333333","#0A460C" ];

    var view = new cdb.forms.Color({ model: this.model, property: 'value', colors: colors });
    this.$el.find('span.field').append(view.render().el);
    this.addView(view);

  }

});

cdb.admin.mod.LegendEditor = cdb.core.View.extend({

    type: 'tool',
    buttonClass: 'legends_mod',
    className: 'legends_panel',

    initialize: function() {

      this.template = this.getTemplate('table/menu_modules/legends/views/legends');

      this._setupModel();
      this._setupPanes();
      this._setupBindings();

    },

    _setupModel: function() {
      this.add_related_model(this.model);
    },

    _setupPanes: function() {

      if (this.panes) this.panes.clean();

      this.panes = new cdb.ui.common.TabPane({
        activateOnClick: true
      });

      this.addView(this.panes);

    },

    _setupBindings: function() {

      this.dataLayer = this.options.dataLayer;

      this.dataLayer.bind("change:wizard_properties", this._onWizardChange, this);
      this.add_related_model(this.dataLayer);

    },

    _onWizardChange: function() {

      //this.model.set("init", false);

      //var type = this.options.dataLayer.get("wizard_properties").type;

      //var legendEditorType = this.model.get("type");

      //if (legendEditorType != null && legendEditorType != "custom" && type != legendEditorType) {
      //}

      this.model.set("type", null);
      this._refreshPanes();

    },

    _onPanelChange: function(name) {

      this.panes.active(name);
      this.model.set("type", name);

      this._renderActivePane();

      if (name != "none") this.panes.getActivePane().refresh();

    },

    _renderTemplateCombo: function() {

      var legends = this.options.legends;
      var extra   = this._getExtraLegendNames();

      if (extra) legends = _.union(this.options.legends, extra);

      if (this.templates) this.templates.clean();

      this.templates = new cdb.forms.Combo({
        property: 'type',
        extra: legends,
        model: this.model
      });

      this.templates.unbind("change", this._onPanelChange);
      this.templates.bind("change", this._onPanelChange, this);

      var $f = this.$('.fields');
      var li = $('<li>');

      li
        .append(this.templates.render().el)
        .append('<span>Template</span>');

      $f.append(li);

      this.addView(this.templates);
    },

    _capitalize: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    _getExtraLegendNames: function() {

      var wizardProperties = this.dataLayer.get("wizard_properties");

      if (wizardProperties) {
        var wizardName = wizardProperties.type;
        return _.intersection(this.options.extraLegends, [wizardName]);
      } else {
        return null;
      }

    },

    /* Render panes */
    _renderPanes: function() {

      _.each(this.options.legends, this._renderPane, this);
      _.each(this._getExtraLegendNames(), this._renderPane, this);

    },

    _renderPane: function(name) {

      var legendClass = this._capitalize(name + "Legend");

      var tab = new cdb.admin.mod[legendClass]({
        model: this.model,
        wizardProperties: this.dataLayer.get("wizard_properties")
      });

      this.panes.addTab(name, tab);
      tab.$el.addClass(name);

    },

    _refreshPanes: function() {

      this.model.set("type", "none");
      this.panes.active("none");

      this.$el.html(this.template);

      this._setupPanes();
      this.panes.setElement(this.$('.forms'));

      this._renderPanes();
      this._renderActivePane();
      this._renderTemplateCombo();

    },

    _renderActivePane: function() {

      var activePane = this.model.get("type") || "none";

      this.panes.active(activePane);

      var tab = this.panes.getActivePane();

      if (tab && tab.model.get("type")) {
        tab._setupItems();
        tab.render();
        //tab.refresh();
      }

    },

    render: function() {

      this.$el.html(this.template);
      this.panes.setElement(this.$('.forms'));

      this._renderPanes();
      this._renderActivePane();
      this._renderTemplateCombo();

      return this;
    }

});

/**
 * NoneLegend
 */
cdb.admin.mod.NoneLegend = cdb.core.View.extend({

  initialize: function() {
  },

  render: function() {
    return this;
  }

});

/**
 * CustomLegend
 */
cdb.admin.mod.CustomLegend = cdb.core.View.extend({

  events: {

    "click .add":    "_addItem"

  },

  initialize: function() {

    this.template           = this.getTemplate('table/menu_modules/legends/views/custom_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'

  },

  refresh: function() {
    this.model.set("init", false);
    this._setupItems();
  },

  _bindItems: function() {
    this.items = this.model.items;

    this.items.unbind("reset", this.render);
    this.items.bind("reset", this.render, this);
  },

  _setupItems: function() {

    this._bindItems();

    if (this.model.get("init")) return;

    this._calculateItems();

  },

  _calculateItems: function() {

  },

  _addItem: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var item = new cdb.geo.ui.LegendItemModel({ name: "Untitled", value: "#cccccc" });
    this.items.add(item);
  },

  _renderItems: function() {
    this.items.each(this._renderItem, this);
  },

  _renderItem: function(item) {

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "name",
      template_name: this.item_template_name
    });

    view.bind("remove", this._removeItem, this);

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);

  },

  _removeItem: function(item) {
    this.items.remove(item.model);
  },

  render: function() {

    this.clearSubViews();

    this.$el.html(this.template);

    this._renderItems();

    return this;
  }

});
