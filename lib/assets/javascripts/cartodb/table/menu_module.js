  
  /**
   *  Each module in a layer panel view.
   *  It could be a filter mod, infowindow mod, sql mod,...
   *
   */

  cdb.admin.Module = cdb.core.View.extend({

    _STORAGE_NAMESPACE: "cdb.localStorage.module.",

    // Set which action to do and width to set
    // when module is active
    _ACTION: {
      type:   'narrow',
      width:  450
    },

    // Get the module action
    getModuleAction: function() {
      return this._ACTION;
    },

    // Trigger module action change
    triggerModuleAction: function() {
      this.trigger('tabChanged', this.getModuleAction());
    }

  });