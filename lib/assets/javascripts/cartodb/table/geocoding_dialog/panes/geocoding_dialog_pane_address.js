
  
  /**
   *  Pane to geocode an address in the World.
   *
   *  - It needs a table and a user models.
   *    
   *    
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.Address = cdb.admin.GeocodingDialog.Pane.extend({

    initialize: function() {
      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:      false,
        formatter:  "",
        kind:       "high-resolution"
      });

      this.template = cdb.templates.getTemplate('table/views/geocoding_dialog/geocoding_dialog_pane_address');

      this._initBinds();
    }

  });
