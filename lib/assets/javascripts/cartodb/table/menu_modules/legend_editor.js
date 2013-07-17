cdb.admin.mod.LegendCollection = Backbone.Collection.extend({
});

cdb.admin.mod.LegendEditor = cdb.core.View.extend({

    buttonClass: 'legends_mod',
    className: 'legends_panel',
    type: 'tool',

    events: { },

    initialize: function() {
      var self = this;

      this.items = new cdb.admin.mod.LegendCollection();
      this.wizard_properties = this.model.get("wizard_properties");

      this.panels = new cdb.ui.common.TabPane({
        activateOnClick: true
      });

      this.addView(this.panels);

    },

    renderTemplateCombo: function() {
      var self = this;

      this.templates = new cdb.forms.Combo({
        property: 'template_name',
        extra: this.options.legends,
        model: this.model
      });

      this.templates.bind("change", function(name) {
        this.panels.active(name);
        console.log(this.options.table);
      }, this);

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
        var type = legend.type;
        var p = self.panels.getPane(type);

        if (p) {
          p.setCarpropertiesSilent(legend.properties);
          self.panels.active(type);
        }
      }

    },

    _capitalize: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    renderLegends: function() {

      var self = this;

      //this.panels.unbind('tabEnabled',this._enableModules, this);
      //this.panels.removeTabs();

      _(this.options.legends).each(function(legend){

        var legendClass = self._capitalize(legend + "Legend");

        self.panels.addTab(legend, new cdb.admin.mod[legendClass]({
          table: self.options.table,
          //model: self.cartoStylesGeneration,
          map: self.options.map
        }).render());

      });


      //this.panels.bind('tabEnabled',this._enableModules, this);

    },

    render: function() {

      var self = this;

      var template = this.getTemplate('table/menu_modules/legends/views/legends');
      this.$el.html(template);

      this.panels.setElement(this.$('.forms'));
      this.panels.active('custom');

      this.renderTemplateCombo();
      this.renderLegends();

      return this;
    }

});
