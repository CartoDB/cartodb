/**
 * IntensityLegend
 */
cdb.admin.mod.IntensityLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "intensity",

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/intensity_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/intensity_legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/intensity_legend_item_color';

  },

  _calculateItems: function() {

    var items = [];

    this.color = this.wizardProperties.properties["marker-fill"];

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color",  name: "Color",       value: this.color }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",   name: "Left label",  value: "left label" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",   name: "Right label", value: "right label" }));

    this.items.reset(items);

  },

  _renderItem: function(item) {

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      template_name: this.item_templates[item.get("type")]
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);

  }

});
