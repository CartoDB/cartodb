/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "bubble",

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/bubble_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/bubble_legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/bubble_legend_item_color';

  },

  _calculateItems: function() {

    var items = [];

    var color = this.wizardProperties.properties["marker-fill"];

    var min, max;

    if (this.wizardProperties.metadata && this.wizardProperties.metadata.length > 0) {
      min   = this.wizardProperties.metadata[0];
      max   = this.wizardProperties.metadata[this.wizardProperties.metadata.length - 1];
    } else {
      min = "";
      max = "";
    }

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",       value: color }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label",  value: "< " + min }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Right label", value: max + " >" }));

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
