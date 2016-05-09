/**
 * IntensityLegend
 */
cdb.admin.mod.IntensityLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "intensity",

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/intensity_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/legend_item_color';

  },

  _setupSync: function() {

    this.leftLabel  = "Less";
    this.rightLabel = "More";

    this.leftSync  = true;
    this.rightSync = true;

    if (this.items && this.items.length > 1 && this.items.at(0).get("legend_type") == "intensity") {

      this.leftSync  = this.items.at(0).get("sync");
      this.rightSync = this.items.at(1).get("sync");

      this.leftLabel  = !this.leftSync  ? this.leftLabel  : this.items.at(0).get("value");
      this.rightLabel = !this.rightSync ? this.rightLabel : this.items.at(1).get("value");

    }

  },

  _calculateItems: function() {

    var items = [];

    this.color = this.wizardProperties.get("marker-fill");

    this._setupSync();

    items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "intensity", type: "text",  name: "Left label",  sync: this.leftSync, value: this.leftLabel }));
    items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "intensity", type: "text",  name: "Right label", sync: this.rightSync, value: this.rightLabel }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",       value: this.color }));

    this.items.reset(items);

  },

  _renderItem: function(item) {
    if (item.attributes.type == "color") {
      return;
    }

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      showSwitch: true,
      filter_type: "intensity",
      template_name: this.item_templates[item.get("type")],
      extra_colors: this.options.extra_colors
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);

    this.legendItems.push(view);

  }

});

