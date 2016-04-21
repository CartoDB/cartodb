var cdb = require('cartodb.js');
var template = require('./infowindow-items.tpl');
var InfowindowFieldsView = require('./infowindow-fields-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    this._layerTableModel = opts.layerTableModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    var columnsCollection = this._layerTableModel.columnsCollection;

    this.infowindowFieldsView = new InfowindowFieldsView({
      columnsCollection: columnsCollection
    });

    this.$('.js-content').html(this.infowindowFieldsView.render().$el);

    return this;
  }

});
