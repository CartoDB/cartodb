cdb.admin.mod.TorqueHeatWizard = cdb.admin.mod.TorqueWizard.extend({
  initialize: function() {
    this.type = 'torque_heat';
    this.layer_type = 'torque';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
  },
  _bindChanges: function() {
    cdb.admin.mod.SimpleWizard.prototype._bindChanges.call(this);
    this.cartoProperties.bind('change', this.showHeatAnimationFields, this);
    this.cartoProperties.bind('change:heat-animated', this.setDefaults, this);
    this.cartoProperties.bind('change:torque-cumulative', this.setDefaults, this);
  },
  render: function(){
  	cdb.admin.mod.SimpleWizard.prototype.render.call(this);
  	this.showHeatAnimationFields();
  	return this;
  },
  setDefaults: function(){
    var animated = this.cartoProperties.get('heat-animated');
    if (animated === undefined) return;
    if(animated === false){
        this.cartoProperties.set({
          'torque-frame-count': 1,
          'torque-resolution': 2 ,
          'torque-trails': 0
        });
      }
    else{
      var cumulative = this.cartoProperties.get('torque-cumulative');
      if(cumulative){
        this.cartoProperties.set({
          'torque-frame-count': 512,
          'torque-resolution': 10
        });
      }
      else{
        this.cartoProperties.set({
          'torque-frame-count': 32,
          'torque-resolution': 8,
          'torque-trails': 2
        });
      }
    }
  },

  showHeatAnimationFields: function(){
    var self = this;
    var v = self.form.getFieldByName('Animated');
    var animated = self.cartoProperties.get('heat-animated');
    if (!v) return;

    var time_col = self.form.getFieldByName('Time Column');
    var duration = self.form.getFieldByName('Duration (secs)');
    var steps = self.form.getFieldByName('Steps');
    var cumulative = self.form.getFieldByName('Cumulative');
    var trails = self.form.getFieldByName('Trails');

      time_col && time_col.hide();
    if (!animated) {
      duration && duration.hide();
      steps && steps.hide();
      cumulative && cumulative.hide();
      trails && trails.hide();
    }
    else {
      time_col && time_col.show();
      duration && duration.show();
      steps && steps.show();
      cumulative && cumulative.show();
      trails && trails.show();
    }
  }

});