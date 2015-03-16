
/**
 *  Default legend pane: allows toggling titles
 *
 */

cdb.admin.mod.LegendFieldsPane = cdb.core.View.extend({

  className: "fieldPane",

  // types not present here are just the same
  wizardTypeToLegend: {
    'torque_cat': 'category'
  },

  initialize: function() {

    this.template = this.getTemplate("table/menu_modules/legends/views/legend_fields_pane");

    this.dataLayer        = this.options.dataLayer;
    this.availableLegends = this.options.availableLegends;

    this._setupModel();
    this._setupPanes();
    this._setupBindings();
    this._setupStorage();

    this.render();

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

    var self = this;

    this.add_related_model(this.dataLayer);

    this.dataLayer.wizard_properties.bind("change", this._onWizardChange, this);
    this.dataLayer.bind("change:tile_style", this._onStyleChange, this);

    this.add_related_model(this.dataLayer.wizard_properties);

    this.model.bind("change:template", this._toggleContent, this);

    this.model.bind("change:items", function() {
      self._saveState();
      self.currentLegendPane.render();
    }, this);

  },

  /**
   * Stores the state of the custom legend pane
   */
  _saveState: function() {

    if (this.model.get("type") == 'custom') {
      this._saveItems();
    }

  },

  /**
   * Setup for the local storage
   */
  _setupStorage: function() {
    version = "_3.0";
    this.storageKey = this.dataLayer.get("table_name") + version;
    this.savedItems = new cdb.admin.localStorage(this.storageKey);
  },

  /**
   * Makes a copy of the item collection
   */
  _saveItems: function() {
    this.savedItems.set(this.model.get("items"));
  },

  /**
   * Retrieves the stored items
   */
  _getSavedItems: function() {
    return this.savedItems.get();
  },

  /**
   * Replace the current items with the stored ones
   */
  _loadSavedItems: function() {
    var items = this.savedItems.get();

    if (items) {
      this.model.items.reset(items);
    }
  },

  _enableLegend: function(name) {

    var enabledLegends  = ["none", "custom", name];

    _.each(this.availableLegends, function(legend) {
      legend.enabled = _.contains(enabledLegends, legend.name) ? true : false;
    });

  },

  _getLegendType: function() {
    var t = this.dataLayer.wizard_properties.get('type');
    if (this.wizardTypeToLegend[t]) {
      t = this.wizardTypeToLegend[t];
    }
    return t;
  },

  _enableLegendFromWizard: function() {
    var t = this._getLegendType();
    if (t) {
      this._enableLegend(t);
    }
  },

  /**
   * Replace the current items with the stored ones
   */
  _loadTab: function(type, old_type) {

    this._activatePane(type);

    this.currentLegendPane.wizardProperties = this.dataLayer.wizard_properties;

    // If we're loading the custom legend, we need to load the saved items
    // (except if we come from a category legend… in that case, we don't
    // do anything)

    if (type === 'custom' && old_type !== 'category') {

      this._loadSavedItems();

    }
    else if (type !== 'custom') {

      this.currentLegendPane._calculateItems();

    }

    this._changeColors();
    this.currentLegendPane.render();

  },

  _activatePane: function(name) {

    this.panes.active(name);
    this.currentLegendPane = this.panes.getActivePane();

  },

  _reloadActiveTab: function() {

    var name = this.model.get("type") || "none";

    this._activatePane(name);

    if (name && this.currentLegendPane && this.currentLegendPane.model.get("type")) {

      this.currentLegendPane.render();
      this.currentLegendPane.refresh(this.model.items.models);

      this._enableLegendFromWizard();

    }

  },

  _onWizardChange: function(m) {

    var wizardProperties = m.attributes;
    var previousWizardProperties = m.previousAttributes();

    var currentType  = m.get("type");
    var previousType = previousWizardProperties.type;

    var metadataDiff = _(wizardProperties.metadata).difference(previousWizardProperties.metadata)

    // Don't change the legend if we chose the customized one
    if (this.model.get("type") === 'custom') {
      var type = this._getLegendType();


      this._enableLegend(type);
      this._refreshTemplateCombo();

      return;
    }

    // Let's check what has changed and decide if we want to update the legend or not
    if (currentType === previousType) {
      var currentProperty  = m.get('property');
      var previousProperty = previousWizardProperties.property;
      var equalProperty = currentProperty == previousProperty;

      if (this.model.get("type") === 'custom') {
        return;
      } else if (currentType === 'category') {
        var difference = _.difference(m.get('categories'), previousWizardProperties.categories);
        if (equalProperty && (!difference || (difference && difference.length === 0))) {
          return;
        }
      } else if (currentType === 'bubble') {

        var equalMarkerFill = (m.get("marker-fill") == previousWizardProperties["marker-fill"]);
        var equalRadiusMin  = (m.get("radius_min")  == previousWizardProperties["radius_min"]);
        var equalRadiusMax  = (m.get("radius_max")  == previousWizardProperties["radius_max"]);

        if (equalProperty && equalMarkerFill && equalRadiusMin && equalRadiusMax && metadataDiff.length === 0) {
          return;
        }

      } else if (currentType === 'intensity') {
        if (m.get("marker-fill") == previousWizardProperties["marker-fill"]) {
          return;
        }
      } else if (currentType === 'density' || currentType === 'choropleth') {

        var equalColorRamp = (m.get("color_ramp") === previousWizardProperties["color_ramp"]);
        var equalMethod    = (m.get("method") === previousWizardProperties["method"]);

        var condition = equalColorRamp && equalMethod;

        if (condition && (currentType === "density" || currentType === 'choropleth' && metadataDiff.length === 0)) {
          return;
        }
      }
    }

    var type = this._getLegendType();

    if (type === "polygon" && this.model.get("type") === "custom") {
      return;
    } else if (!_.contains(this._getPanes(), type)) {
      type = "none";
    }

    this._enableLegend(type);
    this._refreshTemplateCombo();

    if (!this.model.get("template")) {

      var opt = { template: "", type: type };

      // check validity of legend
      if (this._getNumericColumns().length == 0 && (type == "choropleth" || type == "bubble")) {
        var opt = { items: "", template: "", type: "none" };
      }

      this.model.set(opt);

    }

    this._loadTab(type);

  },

  _getNumericColumns: function() {
    var table = this.dataLayer.table;
    return _.filter(table.columnNamesByType('number'), function(c) {
      return c != "cartodb_id"
    });
  },

  _getPanes: function() {
    var legends = this.availableLegends;
    return _.pluck(legends, 'name');
  },

  _getEnabledPanes: function() {
    var legends = _.filter(this.availableLegends, function(legend) {
      return legend["enabled"];
    });

    return _.pluck(legends, 'name');
  },

  _refreshTemplateCombo: function() {
    var legends = this._getEnabledPanes();
    this.templates.updateData(legends);
  },

  _renderTemplateCombo: function() {

    var legends = this._getEnabledPanes();

    if (this.templates) this.templates.clean();

    this.templates = new cdb.forms.Combo({
      property: 'type',
      extra: legends,
      model: this.model
    });

    this.model.unbind("change:type", this);
    this.model.bind("change:type", function(model, value) {

      var type     = model.get("type");
      var old_type = model.previous("type");

      this._loadTab(type, old_type);

    }, this);

    var $f = this.$('.fields');
    var li = $('<li>');

    li
    .append(this.templates.render().el)
    .append('<span>Template</span>');

    $f.append(li);

    this.addView(this.templates);
  },


  _getCartoColors: function() {

    var style = this.options.dataLayer.get("tile_style");

    var cartoParser = new cdb.admin.CartoParser(style);
    var colors = cartoParser.colorsUsed( { mode: "hex" });

    colors = _.uniq(colors); // remove duplicated
    colors = _.without(colors, "white", "WHITE", "#fff", "#ffffff", "#FFF", "#FFFFFF"); // remove white
    colors = _.without(colors, "black", "BLACK", "#000", "#000000"); // remove black

    return colors;

  },

  _changeColors: function() {

    var colors = this._getCartoColors();
    var tab    = this.panes.getActivePane();

    if (tab && tab.legendItems){
      tab.options.extra_colors = colors;
      _.each(tab.legendItems, function(item) {
        if (item.colorForm) {
          item.colorForm.setExtraColors(colors);
        }
      });
    }
  },

  _onStyleChange: function() {
    this._changeColors();
  },

  _capitalize: function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  _getExtraLegendNames: function() {

    var type = this.dataLayer.wizard_properties.get("type");

    if (type) {
      return _.intersection(this.options.extraLegends, [type]);
    } else {
      return null;
    }

  },

  /* Render panes */
  _renderPanes: function() {

    this.clearSubViews();

    _.each(_.pluck(this.availableLegends, "name"), this._renderPane, this);

  },

  _renderPane: function(name) {
    if (this.wizardTypeToLegend[name]) {
      name = this.wizardTypeToLegend[name];
    }

    var legendClass = this._capitalize(name + "Legend");

    var tab = new cdb.admin.mod[legendClass]({
      model: this.model,
      table_id: this.options.dataLayer.get("id"),
      wizardProperties: this.dataLayer.wizard_properties
    });

    this.panes.addTab(name, tab);
    tab.$el.addClass(name);

  },

  render: function() {

    this.clearSubViews();
    this.$el.html(this.template);
    this.panes.setElement(this.$('.forms'));

    this._renderPanes();
    this._reloadActiveTab();

    this._enableLegendFromWizard();

    this._renderTemplateCombo();
    this._toggleContent();

    if (this.currentLegendPane)
      this.currentLegendPane.render();

    this._changeColors();

    return this;
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

  _showNoContent: function() {
    this.$('.no_content').show();
    this.$('div.all').hide();
  }

});
