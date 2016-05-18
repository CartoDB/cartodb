var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleLabelsPropertiesFormView = require('./style-labels-properties-form-view');
var StyleAnimatedPropertiesFormView = require('./style-animated-properties-form-view');
var StyleShapePropertiesFormView = require('./style-shape-properties-form-view');
var template = require('./style-properties-form.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
  },

  render: function () {
    this.clearSubViews();
    var stepNumber = !_.isEmpty(this._styleModel.get('aggregation')) ? 3 : 2;
    this.$el.html(
      template({
        stepNumber: stepNumber
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    var currentGeometry = this._querySchemaModel.getGeometry();

    var shapeFormView = new StyleShapePropertiesFormView({
      styleModel: this._styleModel,
      querySchemaModel: this._querySchemaModel
    });
    this.addView(shapeFormView);
    this.$('.js-propertiesForm').append(shapeFormView.render().el);

    var labelsFormView = new StyleLabelsPropertiesFormView({
      styleModel: this._styleModel,
      querySchemaModel: this._querySchemaModel
    });
    this.addView(labelsFormView);
    this.$('.js-propertiesForm').append(labelsFormView.render().el);

    if (currentGeometry && currentGeometry.getSimpleType() === 'point') {
      var animatedFormView = new StyleAnimatedPropertiesFormView({
        layerDefinitionsCollection: this._layerDefinitionsCollection,
        styleModel: this._styleModel,
        querySchemaModel: this._querySchemaModel
      });
      this.addView(animatedFormView);
      this.$('.js-propertiesForm').append(animatedFormView.render().el);
    }
  }

});
