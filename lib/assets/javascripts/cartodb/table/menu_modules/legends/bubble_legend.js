/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "bubble",

  _setupTemplates: function() {
    this.template = this.getTemplate('table/menu_modules/legends/views/bubble_legend_pane');

    this.itemTemplates = {
      text: 'table/menu_modules/legends/views/legend_item_text',
      color: 'table/menu_modules/legends/views/legend_item_color'
    };
  },

  _setupSync: function(min, max) {
    this.leftLabel  = min;
    this.rightLabel = max;

    this.leftSync  = false;
    this.rightSync = false;

    if (this.items && this.items.length > 1 && this.items.at(0).get("legend_type") === "bubble") {
      this.leftSync  = this.items.at(0).get('sync');
      this.rightSync = this.items.at(1).get('sync');

      this.leftLabel  = this.leftSync  ? this.items.at(0).get("value") : this.leftLabel;
      this.rightLabel = this.rightSync ? this.items.at(1).get("value") : this.rightLabel;
    }
  },

  // implements cdb.admin.mod.CustomLegend.prototype._calculateItems
  _calculateItems: function() {
    var items = [];
    var color = this.wizardProperties.get("marker-fill");
    var metadata = this.wizardProperties.get("metadata");

    if (metadata) {
      var min = metadata[0];
      var max = _.last(metadata);

      this._setupSync(min, max);

      items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "bubble", name: "Left label",  type: "text", sync: this.leftSync, value:  this.leftLabel }));
      items.push(new cdb.geo.ui.LegendItemModel({ legend_type: "bubble", name: "Right Label", type: "text", sync: this.rightSync, value: this.rightLabel }));
      items.push(new cdb.geo.ui.LegendItemModel({ name: "Color", type: "color", value: color }));

      this.items.reset(items);
    }
  },

  // implements cdb.admin.mod.CustomLegend.prototype._renderItem
  _renderItem: function(item) {
    if (item.attributes.type == "color") {
      return;
    }

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      showSwitch: true,
      template_name: this.itemTemplates[item.get("type")],
      extra_colors: this.options.extra_colors
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
    this.legendItems.push(view);
  }
});
