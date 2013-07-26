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

      var self = this;

      this._setupModel();
      this._setupPanes();
      this._setupBindings();

    },

    _setupBindings: function() {

      this.dataLayer = this.options.dataLayer;

      this.dataLayer.bind("change:wizard_properties", this._onWizardChange, this);
      this.add_related_model(this.dataLayer);

    },

    _onWizardChange: function() {


      this._setupPanes();
      this.render();

    },

    _setupModel: function() {
      this.add_related_model(this.model);
    },

    _setupPanes: function() {

      if (this.panels) this.panels.clean();
      this.panels = new cdb.ui.common.TabPane({
        activateOnClick: true
      });

      this.addView(this.panels);

    },

    _onPanelChange: function(name) {

      this.panels.active(name);
      this.model.set("type", name);

      if (name != "none") this.panels.getActivePane().refresh();

    },

    _renderTemplateCombo: function() {
      var self = this;

      var legends = this.options.legends;
      var extra   = this._getExtraLegendNames();

      if (extra) legends = _.union(this.options.legends, extra);

      if (this.templates) this.templates.clean();

      this.templates = new cdb.forms.Combo({
        property: 'type',
        extra: legends,
        model: this.model
      });

      this.templates.bind("change", this._onPanelChange, this);

      var $f = this.$('.fields');
      var li = $('<li>');

      li
        .append(this.templates.render().el)
        .append('<span>Template</span>');

      $f.append(li);

      this.addView(this.templates);
    },

    _updateForms: function() {

      var self = this;

      if (self.model.get('legend_properties')) {

        var legend = self.model.get('legend_properties');
        var type   = legend.type;
        var p      = self.panels.getPane(type);

        if (p) {
          p.setCarpropertiesSilent(legend.properties);
          self.panels.active(type);
        }
      }

    },

    _capitalize: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    _renderPanes: function() {

      _.each(this.options.legends, this._renderPane, this);
      _.each(this._getExtraLegendNames(), this._renderPane, this);

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

    _renderPane: function(name) {

      var legendClass = this._capitalize(name + "Legend");

      var tab = new cdb.admin.mod[legendClass]({
        model: this.model,
        table: this.options.table,
        map:   this.options.map,
        wizardProperties: this.dataLayer.get("wizard_properties")
      }).render();

      tab.$el.addClass(name);

      this.panels.addTab(name, tab);

    },

    render: function() {

      var self = this;

      var template = this.getTemplate('table/menu_modules/legends/views/legends');
      this.$el.html(template);

      this.panels.setElement(this.$('.forms'));
      this._renderPanes();

      var activePane = this.model.get("type") || "none";
      this.panels.active(activePane);

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

    _.bindAll(this, "_renderItem");

    this.template           = this.getTemplate('table/menu_modules/legends/views/custom_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'
    this._setupItems();

  },

  refresh: function() {
    this._setupItems();
  },

  _setupItems: function() {

    this.items = this.model.items;
    //this.items.unbind("reset", this.render);
    this.items.bind("reset", this.render, this);

  },

  _addItem: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var item = new cdb.geo.ui.LegendItemModel({ name: "Untitled", value: "#cccccc" });
    this.items.add(item);
  },

  _renderItems: function() {
    this.items.each(this._renderItem);
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
    console.log('render');

    return this;
  }

});
