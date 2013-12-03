/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "bubble",

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/bubble_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/legend_item_color';

  },

  _setupSync: function(min, max) {

    this.leftLabel  = "< " + min;
    this.rightLabel = max + " >";

    this.leftSync  = true;
    this.rightSync = true;

    if (this.items && this.items.length > 1 && this.items.at(0).get("legend_type") == "bubble") {

      this.leftSync  = this.items.at(0).get("sync");
      this.rightSync = this.items.at(1).get("sync");

      this.leftLabel  = this.leftSync  ? this.leftLabel  : this.items.at(0).get("value");
      this.rightLabel = this.rightSync ? this.rightLabel : this.items.at(1).get("value");

    }

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

    this._setupSync(min, max);

    items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "bubble", name: "Left label",  type: "text",  sync: this.leftSync, value: this.leftLabel }));
    items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "bubble", name: "Right Label", type: "text",  sync: this.rightSync, value: this.rightLabel }));
    items.push(new cdb.geo.ui.LegendItemModel({ name: "Color", type: "color", value: color }));

    this.items.reset(items);

  },

  _renderItem: function(item) {

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      showSwitch: true,
      template_name: this.item_templates[item.get("type")],
      extra_colors: this.options.extra_colors
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
    this.legendItems.push(view);

  }

});

