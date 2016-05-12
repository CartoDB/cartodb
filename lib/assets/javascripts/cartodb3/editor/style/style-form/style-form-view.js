var cdb = require('cartodb.js');
var _ = require('underscore');
var StylePropertiesFormView = require('./properties-style-form/style-properties-form-view');
var StyleAggregationFormView = require('./aggregation-style-form/aggregation-style-form-view');
var styleFormNotReadyTemplate = require('./style-form-not-ready.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._styleModel = opts.styleModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    if (this._styleModel.get('type') === 'none') {
      this._renderStateless();
    } else {
      this._initFormViews();
    }
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:type', this.render, this);
    this.add_related_model(this._styleModel);
  },

  _renderStateless: function () {
    this.$el.append(
      styleFormNotReadyTemplate({
        status: this._querySchemaModel.get('status')
      })
    );
  },

  _initFormViews: function () {
    if (!_.isEmpty(this._styleModel.get('aggregation'))) {
      var aggregationFormView = new StyleAggregationFormView({
        styleModel: this._styleModel,
        querySchemaModel: this._querySchemaModel
      });

      this.addView(aggregationFormView);
      this.$el.append(aggregationFormView.render().el);
    }

    var styleFormView = new StylePropertiesFormView({
      styleModel: this._styleModel,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      querySchemaModel: this._querySchemaModel
    });

    this.addView(styleFormView);
    this.$el.append(styleFormView.render().el);
  }
});
