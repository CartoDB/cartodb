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

    _.each(items, function(item) {

      var attr = {
        name:  item.get("name"),
        value: item.get("color") || item.get("file") || item.get("value")
      };

      loaded_items.push(new cdb.geo.ui.LegendItemModel(attr));

    });

    this.items.reset(loaded_items);

  },

  _calculateItems: function() {

    var items = [];
    this.temp = false;

    this.categories = this.wizardProperties.get('categories');
    this.colors     = this.wizardProperties.get('colors');

    if (this.colors && this.items && this.items.length > 0) { // colors contain data from the old Wizard, so don't calculate the items

      this.temp = true; // set flag to true to indicate that there are items in the legend
      this.colors = null;

      return;
    }

    if (this.categories) {

      _.each(this.categories, function(category) {

        var attr = {
          name:  category.title,
          value: category.file || category.color
        };

        items.push(new cdb.geo.ui.LegendItemModel(attr));

      });

    }

    this.items.reset(items);

  },

  _renderItems: function() {

    if (this.categories || this.temp) {
      this.$el.find(".no_content").hide();
      this.items.each(this._renderItem, this)

    } else {

      this.$el.find(".no_content").show();

    }

  },

  _renderItem: function(item) {
  }

});


