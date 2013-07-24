/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/bubble_legend_pane');
    this.item_templates = [];
    this.item_templates["text"]  = 'table/menu_modules/legends/views/bubble_legend_item_text';
    this.item_templates["color"] = 'table/menu_modules/legends/views/bubble_legend_item_color';
    this.wizardProperties = this.options.wizardProperties;

    this._setupItems();

  },

  _setupItems: function() {

    this.items = this.model.items;
    this.items.bind("reset", this.render, this);

    var items = [];

    var color = this.wizardProperties.properties["marker-fill"];
    var min   = this.wizardProperties.metadata[0];
    var max   = this.wizardProperties.metadata[this.wizardProperties.metadata.length - 1];

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",      value: color }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label", value: "< " + min }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label", value: max + " >" }));

    this.items.reset(items);

  },

  _renderItems: function() {

    console.log(this.wizardProperties);

    var self = this;

    this.items.each(function(item) {

      var view = new cdb.admin.mod.LegendEditorItem({
        model: item,
        observe: "value",
        template_name: self.item_templates[item.get("type")]
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


