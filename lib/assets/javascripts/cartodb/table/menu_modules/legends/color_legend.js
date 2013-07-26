
cdb.admin.mod.DebugLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {
    console.log('debug: init');
  },

  _setupItems: function() {
    console.log('debug: setup items');
  },

  _renderItems: function() {
    console.log('debug: render items');

  },

  _renderItem: function() {
    console.log('debug: render item');
  },

  render: function() {
    console.log('debug: render');
  }

});


/**
 * ColorLegend
 */
cdb.admin.mod.ColorLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this._setupTemplates();

    this.wizardProperties = this.options.wizardProperties;

    //this._setupItems();

  },

  _setupTemplates: function() {
    this.template           = this.getTemplate('table/menu_modules/legends/views/color_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/color_legend_item'
  },

  _setupItems: function() {

    this._bindItems();

    if (this.model.get("init")) return;

    this._calculateItems();

  },

  _calculateItems: function() {
    this.model.set("init", true);

    var items = [];

    this.colors = this.wizardProperties.properties.colors;

    if (this.colors) {

      _.each(this.colors, function(color) {
        items.push(new cdb.geo.ui.LegendItemModel({ name: color[0], value: color[1] } ));
      });

    }

    this.items.reset(items);

  },

  _renderItems: function() {

    if (this.colors) {
      this.$el.find(".no_content").hide();

      this.items.each(this._renderItem, this)

    } else {

      this.$el.find(".no_content").show();

    }

  },

  _renderItem: function(item) {

    var view = new cdb.admin.mod.LegendEditorItem({
      model: item,
      observe: "value",
      template_name: this.item_template_name
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
  }

}

);


