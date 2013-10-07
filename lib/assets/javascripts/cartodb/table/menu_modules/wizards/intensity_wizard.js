cdb.admin.mod.IntensityWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ["infowindow"],

  initialize: function() {
    this.options.form = cdb.admin.forms.get('intensity');
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

    this.type = 'intensity';

    this.options.table.bind('change:schema', function() {
      this.render();
    }, this);
  }

});


