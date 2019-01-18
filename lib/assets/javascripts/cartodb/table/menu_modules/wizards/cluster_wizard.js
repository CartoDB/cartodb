/**
 * ClusterWizard
 */
cdb.admin.mod.ClusterWizard = cdb.admin.mod.SimpleWizard.extend({

  MODULES: ['legends'],

  initialize: function() {
    this.type = 'cluster';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
  }

});


