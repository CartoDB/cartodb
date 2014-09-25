
  /**
   *  Model to get available geometries from a
   *  location (column_name from table or free_text)
   *
   */

  cdb.admin.GeocodingDialog.AvailableGeometries = cdb.core.Model.extend({

    urlRoot: '/api/v1/geocodings/available_geometries',

    parse: function(r) {
      return { available_geometries: r }
    }

  })