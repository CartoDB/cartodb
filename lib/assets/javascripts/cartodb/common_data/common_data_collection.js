
  /**
   *  Common data collection
   *  
   *  - It will get all common data tables from the desired/specified
   *  account using common_data endpoint.
   *
   */
  
  cdb.admin.CommonData.Collection = Backbone.Collection.extend({

    url: '/api/v1/common_data',

    comparator: function(table) {
      return -new Date(table.get("created_at"));
    },

    parse: function(r) {
      // Check if results are empty, in that case, get
      // file with static tables
      if (r.visualizations.length === 0) {
        r.visualizations = cdb.admin.CommonData.StaticTables;
      }

      return r.visualizations
    }

  });