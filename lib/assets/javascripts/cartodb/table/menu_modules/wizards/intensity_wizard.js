cdb.admin.mod.IntensityWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ["infowindow", "legends"],

  initialize: function() {
    this.type = 'intensity';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
    this.options.table.bind('change:schema', function() {
      this.render();
    }, this);
  }

});


