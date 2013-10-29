/**
 * CategoryLegend
 */
cdb.admin.mod.CategoryLegend = cdb.admin.mod.CustomLegend.extend({

  _FILTER_NAME: "category",

  _setupTemplates: function() {
    this.template           = this.getTemplate('table/menu_modules/legends/views/category_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/category_legend_item'
  },

  refresh: function(items) {

    var loaded_items = [];

    this.categories = true;

    //console.log("refresh", items);
    _.each(items, function(item) {
      loaded_items.push(new cdb.geo.ui.LegendItemModel({ name: item.get("name"), value: item.get("value"), file: item.get("file"), color: item.get("color") } ));
    });

    this.items.reset(loaded_items);

  },

  _calculateItems: function() {

    var items = [];

    this.categories = this.wizardProperties.properties.categories;

    if (this.categories) {
    console.log(1, this.categories);

      _.each(this.categories, function(category) {
        items.push(new cdb.geo.ui.LegendItemModel({ name: category.title, value: category.value_type == 'file' ? category.file : category.color } ));
      });

    }

    this.items.reset(items);


  },

  _renderItems: function() {

    if (this.categories) {
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
      filter_type: this._FILTER_NAME,
      template_name: this.item_template_name
    });

    this.$el.find("ul").append(view.render().$el);
    this.addView(view);
  }

});


