/**
 * ChoroplethLegend
 */
cdb.admin.mod.ChoroplethLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "choropleth",

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/choropleth_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/choropleth_legend_item';

  },

  _calculateItems: function() {

    var items = [];

    this.metadata   = this.wizardProperties.get('metadata') || [];

    var methodMap = {
      '3 Buckets': 3,
      '5 Buckets': 5,
      '7 Buckets': 7
    };

    var nquartiles = methodMap[this.wizardProperties.get('method')];
    var ramp = cdb.admin.color_ramps[this.wizardProperties.get('color_ramp')][nquartiles];


    /* Left label */
    // If a custom label was previously set, we don't change it
    var isLeftCustom = this.model.get('items') && this.model.get('items')[0] && this.model.get('items')[0].custom_value;
    var leftLabelValue  = isLeftCustom ? this.model.get('items')[0].value : parseFloat(this.metadata[0] || 0, 10).toFixed(2);
    var opts = { type: "text",  name: "Left label",  value: leftLabelValue };
    if (isLeftCustom) opts.custom_value = true;
    items.push(new cdb.geo.ui.LegendItemModel(opts));

    /* Right label */
    // If a custom label was previously set, we don't change it
    var isRightCustom = this.model.get('items') && this.model.get('items')[1] && this.model.get('items')[1].custom_value;
    var rightLabelValue = isRightCustom ? this.model.get('items')[1].value : parseFloat(this.metadata[this.metadata.length - 1] || 0, 10).toFixed(2);
    var opts = { type: "text",  name: "Right label", value: rightLabelValue };
    if (isRightCustom) opts.custom_value = true;
    items.push(new cdb.geo.ui.LegendItemModel(opts));

    _.each(ramp, function(color) {
      items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color", value: color }));
    });

    this.items.reset(items);

  },

  _addItem: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var item = new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color", value: "#cccccc" });

    this.items.add(item);

  },

  _renderItem: function(item) {
    if (item.attributes.type == "color") {
      return;
    }

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      removable: true,
      filter_type: this._FILTER_NAME,
      template_name: this.item_templates[item.get("type")],
      extra_colors: this.options.extra_colors
    });

    view.bind("remove", this._removeItem, this);

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
    this.legendItems.push(view);

  }

});
