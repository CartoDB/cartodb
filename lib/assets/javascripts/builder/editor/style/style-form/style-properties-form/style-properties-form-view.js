var CoreView = require('backbone/core-view');
var StyleLabelsPropertiesFormView = require('./style-labels-properties-form-view');
var StyleAnimatedPropertiesFormView = require('./style-animated-properties-form-view');
var StyleShapePropertiesFormView = require('./style-shape-properties-form-view');
var StyleNotAnimatableView = require('./style-unanimatable-view');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var template = require('./style-properties-form.tpl');

var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionsCollection',
  'querySchemaModel',
  'queryGeometryModel',
  'styleModel',
  'configModel',
  'userModel',
  'userModel',
  'layerDefinitionModel',
  'modals'
];

module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    var stepNumber = this._styleModel.isAggregatedType() ? 3 : 2;
    var simpleGeometry = this._queryGeometryModel.get('simple_geom');

    if (simpleGeometry !== 'point') {
      stepNumber--;
    }

    this.$el.html(
      template({
        stepNumber: stepNumber,
        simpleGeometry: simpleGeometry
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    var styleType = this._styleModel.get('type');
    var animatedFormView;
    var shapeFormView;
    var labelsFormView;

    if (this._isUnanimatable()) {
      shapeFormView = new StyleNotAnimatableView({
        layerDefinitionModel: this._layerDefinitionModel,
        userModel: this._userModel,
        configModel: this._configModel,
        modals: this._modals
      });
      this.addView(shapeFormView);
      this.$('.js-propertiesForm').append(shapeFormView.render().el);
    } else {
      shapeFormView = new StyleShapePropertiesFormView({
        styleModel: this._styleModel,
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        userModel: this._userModel,
        modals: this._modals
      });
      this.addView(shapeFormView);
      this.$('.js-propertiesForm').append(shapeFormView.render().el);

      if (styleType !== StyleConstants.Type.HEATMAP && styleType !== StyleConstants.Type.ANIMATION) {
        labelsFormView = new StyleLabelsPropertiesFormView({
          styleModel: this._styleModel,
          queryGeometryModel: this._queryGeometryModel,
          querySchemaModel: this._querySchemaModel,
          configModel: this._configModel,
          userModel: this._userModel,
          modals: this._modals
        });
        this.addView(labelsFormView);
        this.$('.js-propertiesForm').append(labelsFormView.render().el);
      }

      if (this._queryGeometryModel.get('simple_geom') === 'point' &&
         (styleType === StyleConstants.Type.ANIMATION || styleType === StyleConstants.Type.HEATMAP)) {
        animatedFormView = new StyleAnimatedPropertiesFormView({
          layerDefinitionsCollection: this._layerDefinitionsCollection,
          layerDefinitionModel: this._layerDefinitionModel,
          styleModel: this._styleModel,
          queryGeometryModel: this._queryGeometryModel,
          querySchemaModel: this._querySchemaModel,
          userModel: this._userModel,
          configModel: this._configModel,
          modals: this._modals
        });

        this.addView(animatedFormView);
        this.$('.js-propertiesForm').append(animatedFormView.render().el);
      }
    }
  },

  _isUnanimatable: function () {
    return this._querySchemaModel.columnsCollection.filter(function (colModel) {
      return colModel.get('type') === 'number' || colModel.get('type') === 'date';
    }).length === 0 && this._styleModel.get('type') === 'animated';
  }
});
