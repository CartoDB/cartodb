const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const CartoTableData = require('dashboard/data/table/carto-table-data');

module.exports = CartoTableMetadata.extend({

  fetch: function () {
    this.trigger('sync');
    // nothing to fetch here
  },

  data: function () {
    if (this._data === undefined) {
      this._data = new CartoTableData(null, {
        table: this,
        configModel: this._configModel
      });
      this._data.fetch = function () { };
    }

    if (this.sqlView) {
      return this.sqlView;
    }
    return this._data;
  }
});
