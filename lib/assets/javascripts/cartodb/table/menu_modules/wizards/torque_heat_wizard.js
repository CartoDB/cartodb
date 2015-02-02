cdb.admin.mod.TorqueHeatWizard = cdb.admin.mod.TorqueWizard.extend({
  initialize: function() {
    this.type = 'torque_heat';
    this.layer_type = 'torque';
    cdb.admin.mod.SimpleWizard.prototype.initialize.call(this);
  },
  _bindChanges: function() {
    cdb.admin.mod.SimpleWizard.prototype._bindChanges.call(this);
    this.cartoProperties.bind('change:heat-animated', this.showHeatAnimationFields, this);
  },
  render: function(){
  	cdb.admin.mod.SimpleWizard.prototype.render.call(this);
  	this.showHeatAnimationFields();
  },

  showHeatAnimationFields: function(){
    var self = this;
    var v = self.form.getFieldByName('Animated');
    var animated = self.cartoProperties.get('heat-animated');
    if (!v) return;
    else{
      if(!animated){
        this.cartoProperties.set({
          'torque-frame-count': 1
        });
      }
      else{
        var cumulative = self.cartoProperties.get('torque-cumulative');
          if(cumulative){
            this.cartoProperties.set({
              'torque-frame-count': 512
            });
          }
          else{
            this.cartoProperties.set({
              'torque-frame-count': 32

            });
          }
        
      }
    }

    var time_col = self.form.getFieldByName('Time Column');
    var duration = self.form.getFieldByName('Duration (secs)');
    var steps = self.form.getFieldByName('Steps');
    var resolution = self.form.getFieldByName('Resolution');
    var cumulative = self.form.getFieldByName('Cumulative');

      time_col && time_col.hide();
    if (!animated) {
      duration && duration.hide();
      steps && steps.hide();
      resolution && resolution.hide();
      cumulative && cumulative.hide();
    }
    else {
      time_col && time_col.show();
      duration && duration.show();
      steps && steps.show();
      resolution && resolution.show();
      cumulative && cumulative.show();
    }
    this.options.map.trigger("change:visible");
  },
  renderTabs: function() {
    var heatFlag = this.options.user.featureEnabled("heatmaps");
    this.tabs.$el.html(
      this.getTemplate('table/menu_modules/views/carto_wizard_tabs')(({ heatmap_enabled: heatFlag}))
    );
  },

});