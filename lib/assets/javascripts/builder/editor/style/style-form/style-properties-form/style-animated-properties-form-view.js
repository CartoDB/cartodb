var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
require('builder/components/form-components/index');
var StyleAnimatedFormModel = require('./style-animated-properties-form-model');

module.exports = CoreView.extend({
  module: 'editor/style/style-form/style-properties-form/style-animated-properties-form-view',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._userModel = opts.userModel;
    this._modals = opts.modals;

    this._querySchemaModel = opts.querySchemaModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = opts.styleModel;

    this._animatedFormModel = new StyleAnimatedFormModel(
      this._styleModel.get('animated'),
      {
        parse: true,
        querySchemaModel: this._querySchemaModel,
        queryGeometryModel: this._queryGeometryModel,
        styleModel: this._styleModel,
        userModel: this._userModel,
        modals: this._modals
      }
    );

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._genAnimatedFormView();

    return this;
  },

  _initBinds: function () {
    this._animatedFormModel.on('changeSchema', this.render, this);
  },

  _genAnimatedFormView: function () {
    this._animatedFormView = new Backbone.Form({
      model: this._animatedFormModel
    });

    this._animatedFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._animatedFormView.render().el);
  },

  clearSubViews: function () {
    if (this._animatedFormView) {
      this._animatedFormView.remove(); // the Backbone.Form equivalent to 'view.clean()'
    }

    return CoreView.prototype.clearSubViews.apply(this, arguments);
  }
});
