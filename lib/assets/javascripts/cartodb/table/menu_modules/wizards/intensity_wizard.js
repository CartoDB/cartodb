cdb.admin.mod.IntensityWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ["infowindow"],

  initialize: function() {
    this.options.form = cdb.admin.forms.intensity;
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);

    this.type = 'intensity';

    this.options.table.bind('change:schema', function() {
      this.render();
    }, this);
  },

  render: function() {
    cdb.admin.mod.SimpleWizard.prototype.render.call(this);
    return this;
  }

});


