/**
 * DensityLegend
 */
cdb.admin.mod.DensityLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this._setupTemplates();

    this.wizardProperties = this.options.wizardProperties;

  },

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/density_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/density_legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/density_legend_item_color';

  },

  _calculateItems: function() {

    this.model.set("init", true);

    var items = [];

    this.properties = this.wizardProperties.properties;

    var methodMap = {
      '3 Buckets': 3,
      '5 Buckets': 5,
      '7 Buckets': 7
    };

    var nquartiles = methodMap[this.properties['method']];
    var ramp = cdb.admin.color_ramps[this.properties['color_ramp']][nquartiles];
    console.log(nquartiles, ramp);

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",       value: "blue" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label",  value: "left label" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",       value: "red" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Right label", value: "right label" }));

    this.items.reset(items);

  },

  _renderItems: function() {

    console.log('density rendering items');
    this.items.each(this._renderItem, this)

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


