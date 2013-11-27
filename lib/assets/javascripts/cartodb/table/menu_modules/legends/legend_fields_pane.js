
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

      this.add_related_model(this.options.dataLayer);

      this.options.dataLayer.bind("change:wizard_properties", this._onWizardChange, this);
      this.dataLayer = this.options.dataLayer;
      this.model.bind("change:items", this._saveState, this);
    },

    _saveState: function() {

      if (this.model.get("type") == 'custom') {
        this._saveItems();
      }

    },

    _setupStorage: function() {
      version = "_3.0";
      this.storageKey = this.dataLayer.get("table_name") + version;
      this.savedItems = new cdb.admin.localStorage(this.storageKey);
    },

    _saveItems: function() {
      this.savedItems.set(this.model.get("items"));
    },

    _getSavedItems: function() {
      return this.savedItems.get();
    },

    _loadSavedItems: function() {
      var items = this.savedItems.get();

      if (items) {
        this.model.items.reset(items);
      }
    },

    _shallResetPanes: function() {

      var legendType = this.model.get("type");
      var wizardType = this.options.dataLayer.get("wizard_properties").type;

      return (legendType != "null" && legendType != "custom" && legendType != wizardType);

    },

    _onPanelChange: function(name) {

      this._loadTab(name);

    },

    _activateTemplate: function(name) {

      _.each(this.options.legends, function(legend) {
        if (legend.name == "none" || legend.name == "custom" || legend.name == name) legend.enabled = true;
        else legend.enabled = false;
      });

    },

    _loadTab: function(type) {

      this.model.set("type", type);
      this.panes.active(type);

      var tab = this.panes.getActivePane();
      tab.render();
      tab.wizardProperties = this.dataLayer.get("wizard_properties");

      if (type == 'custom') {
        this._loadSavedItems();
      } else tab._calculateItems();

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

    _onWizardChange: function() {

      var type = this.options.dataLayer.get("wizard_properties").type;

      if (type == "polygon" && this.model.get("type") == "custom") {

        return;

      } else if (!_.contains(this._getPanes(), type)) {

        type = "none";
        this.model.set("type", "none");
        this._activateTemplate(type);
        this._refreshTemplateCombo();
        this._loadTab(type);

      } else {

        this._activateTemplate(type);
        this._refreshTemplateCombo();
        this._loadTab(type);

      }

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

    _renderTemplateCombo: function() {

      var legends = this._getEnabledPanes();

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

      this.clearSubViews();

      _.each(_.pluck(this.options.legends, "name"), this._renderPane, this);

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
      this._reloadActiveTab();

      if (this.options.dataLayer.get("wizard_properties")) {
        var type = this.options.dataLayer.get("wizard_properties").type;
        this._activateTemplate(type);
      }

      this._renderTemplateCombo();

      return this;
    },


  _setupTemplate: function() {
    this.template = this.getTemplate("table/menu_modules/legends/views/legend_fields_pane");
  },

  _showNoContent: function() {
    this.$('.no_content').show();
    this.$('div.all').hide();
  }

});
