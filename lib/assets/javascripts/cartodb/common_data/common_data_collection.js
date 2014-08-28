
  /**
   *  Common data collection
   *  
   *  - It will get all common data tables from the desired/specified
   *  account using common_data endpoint.
   *
   */
  
  cdb.admin.CommonData.Collection = Backbone.Collection.extend({

    url: '/api/v1/common_data',

    parse: function(r) {
      // Check if results are empty, in that case, get
      // file with static tables
      if (r.length === 0) {
        r = cdb.admin.CommonData.StaticTables;
      }

      return r
    }

  });