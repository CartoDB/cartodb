
/**
 *  Default legend pane: allows toggling titles
 *
 */

cdb.admin.mod.LegendFieldsPane = cdb.core.View.extend({

  className: "fieldPane",

  events: {
    //'click .selectall': '_manageAll',
    //"click .reset": "_onResetClick"
  },

  initialize: function() {

    this._setupTemplate();
    this._setupPanes();
    this._setupBindings();
    this._setupStorage();
    this.render();

    //this._setupModel();
    //this._setupPanes();
    //this._setupBindings();
    //this._setupStorage();

    //this.render();
  },

  _setupModel: function() {
    this.add_related_model(this.model);
  },

  _setupTemplate: function() {
    this.template = this.getTemplate("table/menu_modules/legends/views/legend_fields_pane");
  },

  _setupPanes: function() {

    //if (this.panes) this.panes.clean(); // TODO: ?

    this.panes = new cdb.ui.common.TabPane({
      activateOnClick: true
    });

    this.addView(this.panes);
  },

  _setupBindings: function() {

    this.add_related_model(this.options.dataLayer);

    this.options.dataLayer.bind("change:wizard_properties", this._onWizardChange, this);
    this.dataLayer = this.options.dataLayer;

    this.model.bind("change:items", this._saveState, this);
  },

  _add: function() {
    console.log('add')

    if (this.currentLegendPane) {

      this.currentLegendPane.render();
      if (this.currentLegendPane.items) {
        this.model.set("items", this.currentLegendPane.items.toJSON());
      }

      this._saveState();
    }

  },

  _setupStorage: function() {
    version = "_3.0";
    this.storageKey = this.dataLayer.get("table_name") + version;
    this.savedItems = new cdb.admin.localStorage(this.storageKey);
  },

  _saveState: function() {
    if (this.currentLegendPane._FILTER_NAME == 'custom') {
      //console.log('saving state')
      this._saveItems();
    }
  },


  _saveItems: function() {
    this.savedItems.set(this.currentLegendPane.items);
  },

  _getSavedItems: function() {
    return this.savedItems.get();
  },

  _loadSavedItems: function() {
    //console.log('loading items');

    var items = this.savedItems.get();

    if (items) {
      this.currentLegendPane.items.reset(items);
    }
  },

  _shallResetPanes: function() {

    var legendType = this.model.get("type");
    var wizardType = this.options.dataLayer.get("wizard_properties").type;

    return (legendType != "null" && legendType != "custom" && legendType != wizardType);

  },

  _activateTemplate: function(name) {

    //console.log("activating template: ", name);

    var enablingLegends  = ["none", "custom", name];
    var availableLegends = this.options.legends;

    _.each(availableLegends, function(legend) {
      legend.enabled = _.contains(enablingLegends, legend.name) ? true : false;
    });

  },

  _bindActivePane: function() {

    var tab = this.panes.getActivePane();
    if (tab && tab._bindItems) tab._bindItems();

  },

  _unbindActivePane: function() {

    var tab = this.panes.getActivePane();
    if (tab && tab._unbindItems) tab._unbindItems();

  },

  _rebind: function(type) {

    this.panes.active(type);
    this.currentLegendPane = this.panes.getActivePane();

    if (this.currentLegendPane && this.currentLegendPane.items) {
      this.currentLegendPane.items.unbind("change reset remove add", this._add);
      this.currentLegendPane.items.bind("change reset remove add", this._add, this);
    }

  },

  _loadTab: function(type) {

    //console.log('loading tab', type);

    this._rebind(type);

    //this._unbindActivePane();
    //this.model.set("type", type);
    //this._bindActivePane();

    //this.currentLegendPane.render();
    this.currentLegendPane.wizardProperties = this.dataLayer.get("wizard_properties");

    if (type == 'custom') {
      this._loadSavedItems();
    } else this.currentLegendPane._calculateItems();

  },

  _onWizardChange: function() {

    //console.log('changing wizard')

    var type = this.options.dataLayer.get("wizard_properties").type;

    var paneExists = _.contains(this._getPanes(), type);

    //console.log("Changing to", type, paneExists);

    if (type == "polygon" && this.model.get("type") == "custom") {

      return;

    } else if (!paneExists) {

      type = "none";
    }

    this._activateTemplate(type);
    this._refreshTemplateCombo();
    this._rebind(type);
    this.currentLegendPane.wizardProperties = this.dataLayer.get("wizard_properties");

    if (type == 'custom') {
      this._loadSavedItems();
    } else this.currentLegendPane._calculateItems();

    this.model.set("type", type);

  },


  _getPanes: function() {

    var legends = this.options.legends;
    return _.pluck(legends, 'name');

  },

  _getEnabledPanes: function() {

    var legends = _.filter(this.options.legends, function(legend) {
      return legend["enabled"];
    });

    return _.pluck(legends, 'name');

  },



  _refreshTemplateCombo: function() {

    var legends = this._getEnabledPanes();
    this.templates.updateData(legends);

  },



  _onPanelChange: function(name) {

    this._loadTab(name);

  },


  _reloadActiveTab: function() {

    var name = this.model.get("type") || "none";
    this.panes.active(name);

    var tab = this.panes.getActivePane();

    if (name && tab.model.get("type")) {

      tab.render();
      tab.refresh(this.model.items.models);

      if (this.options.dataLayer.get("wizard_properties")) {
        var type = this.options.dataLayer.get("wizard_properties").type;
        this._activateTemplate(name);
      }

    }

  },

  // Renders the combo that allows to choose a legend

  _renderTemplateCombo: function() {

    //if (this.templates) this.templates.clean();

    this.templates = new cdb.forms.Combo({
      property: 'type',
      extra: this._getEnabledPanes(),
      model: this.model
    });

    this.addView(this.templates);

    this.templates.unbind("change", this._loadTab, this);
    this.templates.bind("change", this._loadTab, this);

    var $f = this.$('.fields');
    var li = $('<li>');

    li
    .append(this.templates.render().el)
    .append('<span>Template</span>');

    $f.append(li);

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

    //this.clearSubViews();

    var enabledLegends = _.pluck(this.options.legends, "name");

    _.each(enabledLegends, this._renderPane, this);

  },

  _renderPane: function(name) {

    var legendClass = this._capitalize(name + "Legend");

    var tab = new cdb.admin.mod[legendClass]({
      model: this.model,
      table_id: this.options.dataLayer.get("id"),
      wizardProperties: this.dataLayer.get("wizard_properties")
    });

    this.panes.addTab(name, tab);

    tab.$el.addClass(name);

  },




  render: function() {

    this.clearSubViews();
    this.$el.html(this.template);
    this.panes.setElement(this.$('.forms'));

    this._renderPanes();
    //this._reloadActiveTab();

    var type = this.model.get("type") || "none";
    this._rebind(type);

    if (type && this.currentLegendPane.model.get("type")) {

      this.currentLegendPane.wizardProperties = this.dataLayer.get("wizard_properties");
      this.currentLegendPane.render();
      this._activateTemplate(type);

      this.currentLegendPane.refresh(this.model.items.models);


    }


    if (this.options.dataLayer.get("wizard_properties")) {
      var type = this.options.dataLayer.get("wizard_properties").type;
      this._activateTemplate(type);
    }

    //console.log('default tab', tab);

    this._renderTemplateCombo();


    return this;
  },


  _showNoContent: function() {
    this.$('.no_content').show();
    this.$('div.all').hide();
  }

});
