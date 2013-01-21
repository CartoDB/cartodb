(function() {

  /**
   * contains information about the table, not the data itself
   */
  cdb.open.PublicCartoDBTableMetadata = cdb.admin.CartoDBTableMetadata.extend({

    fetch: function() {
      this.trigger('sync');
      //nothing to fetch here
    },
  });



})();
