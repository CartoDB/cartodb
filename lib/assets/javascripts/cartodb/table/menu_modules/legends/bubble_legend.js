/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/bubble_legend_item'

    this._setupItems();

  }


});


