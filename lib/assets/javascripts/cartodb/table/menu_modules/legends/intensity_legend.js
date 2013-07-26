/**
 * IntensityLegend
 */
cdb.admin.mod.IntensityLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this._setupTemplates();

    this.wizardProperties = this.options.wizardProperties;

    this._setupItems();

  },

  _setupTemplates: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/intensity_legend_pane');

    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/intensity_legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/intensity_legend_item_color';

  },

  _setupItems: function() {

    this.items = this.model.items;

    this.items.unbind("reset", this.render);
    this.items.bind("reset", this.render, this);

    var items = [];

    if (this.model.get("init")) return;
    this.model.set("init", true);

    this.color = this.wizardProperties.properties["marker-fill"];

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",       value: this.color }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label",  value: "left label" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Right label", value: "right label" }));

    this.items.reset(items);

  },

  _renderItems: function() {

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


