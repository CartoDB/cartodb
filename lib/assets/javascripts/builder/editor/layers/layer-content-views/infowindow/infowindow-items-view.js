var CoreView = require('backbone/core-view');
var template = require('./infowindow-items.tpl');
var InfowindowFieldsView = require('./infowindow-fields-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (typeof opts.hasValidTemplate === 'undefined') throw new Error('hasValidTemplate has to be defined');
    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._hasValidTemplate = opts.hasValidTemplate;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._hasValidTemplate) {
      this._initViews();
    }

    return this;
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
      model: this.model,
      querySchemaModel: this._querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.$('.js-content').append(this._infowindowFieldsView.render().$el);
    this.addView(this._infowindowFieldsView);

    return this;
  }
});
