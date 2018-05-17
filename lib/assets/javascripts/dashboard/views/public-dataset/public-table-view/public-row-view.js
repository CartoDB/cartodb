const RowView = require('dashboard/views/public-dataset/table-view/row-view');

/**
 * view used to render each row in public tables
 */
module.exports = RowView.extend({

  classLabel: 'cdb.open.PublicRowView',

  events: {},

  initialize: function () {
    this.options.row_header = false;
    this.order = this.options.order;
  },

  _renderGeometry: function (value) {
    return this._renderDefault('GeoJSON');
  },

  _getRowOptions: function () {},

  click_header: function (e) {}
});
