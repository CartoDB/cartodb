
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

    urlRoot: '/api/v1/geocodings/estimation_for/'

  })
  