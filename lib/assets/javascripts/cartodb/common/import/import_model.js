  
  /**
   *  Import pane model
   *  
   *  It defines the type, value and sync_period
   *  of an import.
   *
   *  new cdb.admin.ImportPaneModel();  
   *
   */

  cdb.admin.ImportPaneModel = cdb.core.Model.extend({
    defaults: {
      type:         '',
      value:        '',
      sync_period:  '0'
    }
  });