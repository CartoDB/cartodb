/**
 * ColorLegend
 */
cdb.admin.mod.ColorLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/color_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/color_legend_item'

    this.wizardProperties = this.options.wizardProperties;

    this._setupItems();

  },

  _setupItems: function() {

    this.items = this.model.items;
    this.items.bind("reset", this.render, this);

    var items = [];

    var colors = this.wizardProperties.properties.colors;

    _.each(colors, function(color) {
      console.log(color);
      items.push(new cdb.geo.ui.LegendItemModel({ name: color[0], value: color[1] } ));
    });

    //var color = this.wizardProperties.properties["marker-fill"];
    //var min   = this.wizardProperties.metadata[0];
    //var max   = this.wizardProperties.metadata[this.wizardProperties.metadata.length - 1];

    //items.push(new cdb.geo.ui.LegendItemModel({ type: "color", name: "Color",      value: color }));
    //items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label", value: "< " + min }));
    //items.push(new cdb.geo.ui.LegendItemModel({ type: "text",  name: "Left label", value: max + " >" }));

    this.items.reset(items);

  },

  _renderItems: function() {

    //console.log("color", this.wizardProperties);

    console.log("colors", this.wizardProperties.properties.colors);

    var self = this;

    this.items.each(function(item) {

      var view = new cdb.admin.mod.LegendEditorItem({
        model: item,
        observe: "value",
        template_name: self.item_template_name
      });

      self.$el.find("ul").append(view.render().$el);
      self.addView(view);

    });

  }


});


