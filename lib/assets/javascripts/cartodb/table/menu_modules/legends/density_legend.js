/**
 * DensityLegend
 */
cdb.admin.mod.DensityLegend = cdb.admin.mod.CustomLegend.extend({

  initialize: function() {

    this.template = this.getTemplate('table/menu_modules/legends/views/density_legend_pane');
    this.item_template_name = 'table/menu_modules/legends/views/custom_legend_item'

    this._setupItems();

  }

});


