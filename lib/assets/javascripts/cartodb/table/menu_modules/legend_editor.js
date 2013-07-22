cdb.admin.mod.LegendEditorCollection = Backbone.Collection.extend({

});

cdb.admin.mod.LegendEditorItem = cdb.core.View.extend({

  tagName: "li",

  events: {

    //"click .value": "onClickValue"

  },

  initialize: function() {

    this.template = this.options.template_name ? this.getTemplate(this.options.template_name) : this.getTemplate('table/menu_modules/legends/views/legend_item');
    this.add_related_model(this.model);

  },

  onClickValue: function(e) {

    e.preventDefault();
    e.stopPropagation();

  },

  render: function() {

    this.$el.append(this.template(this.model.toJSON()));

    this.editInPlace = new cdb.admin.EditInPlace({
      observe: "value",
      model: this.model,
      el: this.$el.find(".input")
    });

    this.editInPlace.unbind("change");
    this.editInPlace.bind("change", function(value) {
    }, this);

    return this;
  }

});

cdb.admin.mod.LegendEditor = cdb.core.View.extend({

    type: 'tool',
    buttonClass: 'legends_mod',
    className: 'legends_panel',

    events: { },

    initialize: function() {

      var self = this;

      this._setupModel();
      this._setupItems();
      this._setupPanes();

    },

    _setupModel: function() {

      this.model.bind('change:type', this.changeType, this);
      this.add_related_model(this.model);

      this.model.bind('change:items', function(e) {

      }, this);

    },

    _setupItems: function() {

      var items  = this.model.get("items");
      this.items = new cdb.admin.mod.LegendEditorCollection(items);

    },

    _setupPanes: function() {

      this.panels = new cdb.ui.common.TabPane({
        activateOnClick: true
      });

      this.addView(this.panels);

    },

    changeType: function(type) {
      //console.log('change type', this.model.attributes);
      //console.log(this.model);
    },

    renderTemplateCombo: function() {
      var self = this;

      this.templates = new cdb.forms.Combo({
        property: 'type',
        extra: this.options.legends,
        model: this.model
      });

      this.templates.bind("change", function(name) {
        this.panels.active(name);
        this.model.set("type", name);
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
    },

    _renderPane: function(name) {

      var legendClass = this._capitalize(name + "Legend");

      this.panels.addTab(name, new cdb.admin.mod[legendClass]({
        model: this.model,
        items: this.items,
        table: this.options.table,
        map:   this.options.map
      }).render());

    },

    render: function() {

      var self = this;

      var template = this.getTemplate('table/menu_modules/legends/views/legends');
      this.$el.html(template);

      this.panels.setElement(this.$('.forms'));
      this._renderPanes();

      this.panels.active('bubble');

      this.renderTemplateCombo();

      return this;
    }

});

/**
 * CustomLegend
 */
cdb.admin.mod.CustomLegend = cdb.core.View.extend({

  initialize: function() {

    this.template           = this.getTemplate('table/menu_modules/legends/views/legend_pane');
    this.items              = this.options.items;
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'

  },

  _renderItems: function() {

    var self = this;

    this.items.each(function(item) {

      var view = new cdb.admin.mod.LegendEditorItem({
        model: item,
        template_name: self.item_template_name
      });

      self.$el.find("ul").append(view.render().$el);

    });

  },

  render: function() {

    this.$el.html(this.template);
    this._renderItems();

    return this;
  }

});
