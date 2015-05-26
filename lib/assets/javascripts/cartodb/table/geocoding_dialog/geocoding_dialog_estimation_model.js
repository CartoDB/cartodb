
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

    initialize: function() {
      var self = this;

      var version = cdb.config.urlVersion('geocoding', 'read');
      this.urlRoot =  "/api/" + version + "/geocodings/estimation_for/";
    }

  })
