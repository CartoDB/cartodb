cdb.admin.mod.TorqueHeatWizard = cdb.admin.mod.TorqueWizard.extend({
  initialize: function() {
    this.type = 'torque_heat';
    this.layer_type = 'torque';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
  }

});