
  /**
   *  Geocoding column model and collection for additional columns
   *  in the geocoding address pane
   *
   */
  
  cdb.admin.GeocodingDialog.ColumnModel = cdb.core.Model.extend({

    defaults: {
      value:  '',
      text:   false
    }

  });


  cdb.admin.GeocodingDialog.ColumnsCollection = Backbone.Collection.extend({
  
    model: cdb.admin.GeocodingDialog.ColumnModel

  })