var template = require('./infowindow-description.tpl');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_manageAll'
  },

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();

    var totalFields = this._getColumnNames().length;
    var selectedFields = this._layerInfowindowModel.fieldCount();

    this.$el.html(
      template({
        allSelected: (selectedFields === totalFields),
        noneSelected: !selectedFields,
        selectedFields: selectedFields
      })
    );

    return this;
  }
});
