var CoreView = require('backbone/core-view');
var StylePropertiesFormView = require('./style-properties-form/style-properties-form-view');
var StyleAggregationFormView = require('./style-aggregation-form/style-aggregation-form-view');
var noneFormMessage = require('./none-form-message.tpl');

module.exports = CoreView.extend({
  module: 'editor/style/style-form/style-form-view',

  className: 'Editor-formView',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = opts.styleModel;
    this._modals = opts.modals;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._styleModel.get('type') === 'none') {
      this._renderNoneMessage();
    } else {
      this._initFormViews();
    }
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:type', this.render, this);
    this.add_related_model(this._styleModel);
  },

  _renderNoneMessage: function () {
    this.$el.append(noneFormMessage());
  },

  _initFormViews: function () {
    if (this._styleModel.isAggregatedType()) {
      var aggregationFormView = new StyleAggregationFormView({
        styleModel: this._styleModel,
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        userModel: this._userModel,
        modals: this._modals
      });

      this.addView(aggregationFormView);
      this.$el.append(aggregationFormView.render().el);
    }

    var propertiesFormView = new StylePropertiesFormView({
      styleModel: this._styleModel,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      configModel: this._configModel,
      userModel: this._userModel,
      layerDefinitionModel: this._layerDefinitionModel,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel,
      modals: this._modals
    });

    this.addView(propertiesFormView);
    this.$el.append(propertiesFormView.render().el);
  }
});
