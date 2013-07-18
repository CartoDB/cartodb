/**
 * BubbleLegend
 */
cdb.admin.mod.BubbleLegend = cdb.core.View.extend({

  initialize: function() {
    this.template = this.getTemplate('table/menu_modules/legends/views/bubble_legend');
  },

  render: function() {
    this.$el.html(this.template);

    return this;
  }

});


