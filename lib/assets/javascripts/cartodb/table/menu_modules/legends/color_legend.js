/**
 * ColorLegend
 */
cdb.admin.mod.ColorLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this._setupTemplates();

    this.wizardProperties = this.options.wizardProperties;

    this._setupItems();

  },

  _setupTemplates: function() {
    this.template           = this.getTemplate('table/menu_modules/legends/views/color_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/color_legend_item'
  },

  _setupItems: function() {

    this.items = this.model.items;
    this.items.unbind("reset", this.render);
    this.items.bind("reset", this.render, this);

    var items = [];

    var colors = this.wizardProperties.properties.colors;

    _.each(colors, function(color) {
      items.push(new cdb.geo.ui.LegendItemModel({ name: color[0], value: color[1] } ));
    });

    this.items.reset(items);

  },

  _renderItems: function() {

    var self = this;

    this.items.each(function(item) {

      var view = new cdb.admin.mod.LegendEditorItem({
        model: item,
        observe: "value",
        template_name: self.item_template_name
      });

      self.$el.find("ul").append(view.render().$el);
      self.addView(view);

    });

  }


});


