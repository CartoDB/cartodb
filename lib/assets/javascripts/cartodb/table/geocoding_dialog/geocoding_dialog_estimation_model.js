
  /**
   *  Geocoding estimation for a table
   *  
   *  - It will show the estimate price of geocoding that table.
   *
   */

  cdb.admin.GeocodingDialog.EstimationModel = cdb.core.Model.extend({

    // defaults: {
    //   rows:       0,
    //   estimation: 0
    // },

    url: function(method) {
      var version = cdb.config.urlVersion('geocoding', method);
      return "/api/" + version + "/geocodings/estimation_for/",
    },

  })
