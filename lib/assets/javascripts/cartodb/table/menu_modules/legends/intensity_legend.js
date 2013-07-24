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
    this.items.bind("reset", this.render, this);

    var items = [];

    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color", value: "red" }));
    items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color", value: "blue" }));

    this.items.reset(items);

  },

  _renderItems: function() {

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


