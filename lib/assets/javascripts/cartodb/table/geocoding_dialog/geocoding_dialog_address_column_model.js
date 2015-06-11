
  /**
   *  Geocoding column model and collection for additional columns
   *  in the geocoding address pane
   *
   */
  
  cdb.admin.GeocodingDialog.ColumnModel = cdb.core.Model.extend({

    defaults: {
      columnValue:  '',
      columnText:   false
    },

    getValue: function() {
      return this.get('columnValue')
    },

    getText: function() {
      return this.get('columnText')
    }

  });


  cdb.admin.GeocodingDialog.ColumnsCollection = Backbone.Collection.extend({
  
    model: cdb.admin.GeocodingDialog.ColumnModel

  })