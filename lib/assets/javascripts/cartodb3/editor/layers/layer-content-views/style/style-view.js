var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerTableModel = this._layerDefinitionModel.layerTableModel;
    this._columnsCollection = this._layerTableModel.getColumnsCollection();
    this._modals = opts.modals;

    this._initBinds();

    if (!this._layerTableModel.get('fetched')) {
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    return this;
  },

  _initBinds: function () {
    this._columnsCollection.bind('reset', function () {
      console.log(this._columnsCollection.toJSON());
    }, this);
  },

  _initViews: function () {

  }
});
