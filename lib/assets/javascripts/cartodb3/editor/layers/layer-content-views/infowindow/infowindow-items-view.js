var cdb = require('cartodb.js');
var template = require('./infowindow-items.tpl');
var InfowindowFieldsView = require('./infowindow-fields-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (typeof opts.hasValidTemplate === 'undefined') throw new Error('hasValidTemplate needs to be defined');
    this._querySchemaModel = opts.querySchemaModel;
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._hasValidTemplate = opts.hasValidTemplate;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._querySchemaModel.get('status') === 'fetched' && this._hasValidTemplate) {
      this._initViews();
    }

    return this;
  },

  _initBinds: function () {
    if (this._querySchemaModel.get('status') !== 'fetched') {
      // status can be: fetched, unavailable, fetching
      this.listenTo(this._querySchemaModel, 'change:status', this.render);
      this._querySchemaModel.fetch();
    }
  },

  _initViews: function () {
    this.$el.html(template({
      title: _t('editor.layers.infowindow.items.title-label')
    }));

    if (this._infowindowFieldsView) {
      this.removeView(this._infowindowFieldsView);
      this._infowindowFieldsView.clean();
    }

    this._infowindowFieldsView = new InfowindowFieldsView({
      layerInfowindowModel: this._layerInfowindowModel,
      querySchemaModel: this._querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.$('.js-content').append(this._infowindowFieldsView.render().$el);
    this.addView(this._infowindowFieldsView);

    return this;
  }
});
