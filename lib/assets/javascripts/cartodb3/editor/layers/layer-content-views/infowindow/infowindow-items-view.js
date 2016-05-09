var cdb = require('cartodb.js');
var template = require('./infowindow-items.tpl');
var InfowindowFieldsView = require('./infowindow-fields-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template({
      title: _t('editor.layers.infowindow.items.title-label'),
      description: _t('editor.layers.infowindow.items.description')
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.infowindowFieldsView = new InfowindowFieldsView({
      layerInfowindowModel: this._layerInfowindowModel,
      querySchemaModel: this._querySchemaModel
    });

    this.$('.js-content').html(this.infowindowFieldsView.render().$el);

    return this;
  }

});
