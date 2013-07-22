cdb.admin.mod.LegendEditorCollection = Backbone.Collection.extend({ });

cdb.admin.mod.LegendEditorItem = cdb.core.View.extend({

  tagName: "li",

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

  _addEditInPlace: function() {

    this.editInPlace = new cdb.admin.EditInPlace({
      observe: this.options.observe,
      model: this.model,
      el: this.$el.find(".input")
    });

    this.addView(this.editInPlace);

  },

  _addColorForm: function() {

    var view = new cdb.forms.Color({ model: this.model, property: 'value' });
    this.$el.find('span.field').append(view.render().el);
    this.addView(view);

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
      this._setupPanes();

    },

    _setupModel: function() {
      this.add_related_model(this.model);
    },

    _setupPanes: function() {

      this.panels = new cdb.ui.common.TabPane({
        activateOnClick: true
      });

      this.addView(this.panels);

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
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'
    this._setupItems();

  },

  _setupItems: function() {

    this.items = this.model.items;
    this.items.bind("reset", this.render, this);

  },

  _renderItems: function() {

    var self = this;

    this.items.each(function(item) {
      console.log(item);

      var view = new cdb.admin.mod.LegendEditorItem({
        model: item,
        observe: "name",
        template_name: self.item_template_name
      });

      self.$el.find("ul").append(view.render().$el);
      self.addView(view);

    });

  },

  render: function() {

    this.clearSubViews();

    this.$el.html(this.template);
    this._renderItems();

    return this;
  }

});
