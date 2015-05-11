  
  /**
   *  Import pane model
   *  
   *  It defines the type, value and interval
   *  of an import.
   *
   *  new cdb.admin.ImportPaneModel();  
   *
   */

  cdb.admin.ImportPaneModel = cdb.core.Model.extend({
    
    defaults: {
      type:     '',
      value:    '',
      interval: '0',
      valid:    false
    }
    
  });