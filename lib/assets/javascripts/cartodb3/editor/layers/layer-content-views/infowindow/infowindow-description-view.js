var template = require('./infowindow-description.tpl');
var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.namesCount) throw new Error('namesCount is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._namesCount = opts.namesCount;
  },

  render: function () {
    this.clearSubViews();

    var totalFields = this._namesCount;
    var selectedFields = this._layerInfowindowModel.fieldCount();

    this.$el.html(
      template({
        allSelected: (selectedFields === totalFields),
        noneSelected: !selectedFields,
        selectedFields: selectedFields
      })
    );

    return this;
  },

  _toggle: function () {
    this.trigger('toggle');
  }
});
