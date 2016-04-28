var cdb = require('cartodb.js');
var template = require('./infowindow-items.tpl');
var InfowindowColumnsView = require('./infowindow-columns-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerTableModel = opts.layerTableModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template({
      title: _t('editor.layers.infowindow.items.title-label'),
      description: _t('editor.layers.infowindow.items.description'),
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.infowindowColumnsView = new InfowindowColumnsView({
      layerInfowindowModel: this._layerInfowindowModel,
      layerTableModel: this._layerTableModel
    });

    this.$('.js-content').html(this.infowindowColumnsView.render().$el);

    return this;
  }

});
