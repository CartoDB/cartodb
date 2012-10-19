(function() {

  /**
   * contains information about the table, not the data itself
   */
  cdb.open.PublicCartoDBTableMetadata = cdb.admin.CartoDBTableMetadata.extend({

    data: function() {
      var self = this;
      if(this._data === undefined) {
        this._data = new cdb.admin.CartoDBTableData(null, {
          table: this
        });

        this._data.fetch = function() { self._data.trigger('reset'); self._data.trigger('dataLoaded'); };
      }
      if(this.sqlView) {
        return this.sqlView;
      }
      return this._data;
    },
  });



})();
