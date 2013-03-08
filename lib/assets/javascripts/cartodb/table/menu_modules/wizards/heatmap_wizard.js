cdb.admin.mod.HeatmapWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ["infowindow"],

  initialize: function() {
    this.options.form = cdb.admin.forms.heatmap;
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

    this.type = 'heatmap';

    this.options.table.bind('change:schema', function() {
      this.render();
    }, this);
  },

  render: function() {
    cdb.admin.mod.SimpleWizard.prototype.render.call(this);
    return this;
  }

});


