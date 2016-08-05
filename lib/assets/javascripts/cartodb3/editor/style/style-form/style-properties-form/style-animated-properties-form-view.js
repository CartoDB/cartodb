var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
require('../../../../components/form-components/index');
var StyleAnimatedFormModel = require('./style-animated-properties-form-model');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = opts.styleModel;

    this._animatedFormModel = new StyleAnimatedFormModel(
      this._styleModel.get('animated'),
      {
        parse: true,
        querySchemaModel: this._querySchemaModel,
        styleModel: this._styleModel
      }
    );
  },

  render: function () {
    this.clearSubViews();
    this._genAnimatedFormView();
    return this;
  },

  // _initAnimatedEnablerView: function () {
  //   var alreadyTorqueLayer = this._layerDefinitionsCollection.isThereAnyTorqueLayer();
  //   var isTorqueLayer = this._layerDefinitionModel.get('type') === 'torque';
  //   var isAnimatedEnabled = this._enablerModel.get('enabler');

  //   var enablerOpts = {
  //     model: this._enablerModel,
  //     title: _t('editor.style.components.animated-enabled.label'),
  //     help: _t('editor.style.components.animated-enabled.not-with-labels'),
  //     key: 'enabler'
  //   };

  //   if (!isAnimatedEnabled) {
  //     _.extend(
  //       enablerOpts, {
  //         disabled: alreadyTorqueLayer && !isTorqueLayer,
  //         help: alreadyTorqueLayer && !isTorqueLayer ? _t('editor.style.components.animated-enabled.already-one-torque') : _t('editor.style.components.animated-enabled.not-with-labels')
  //       }
  //     );
  //   }

  //   this._enablerView = new Backbone.Form.editors.Enabler(enablerOpts);
  //   this._enablerModel.bind('change', this._setAnimatedFormView, this);
  //   this.add_related_model(this._enablerModel);

  //   this.$el.append(this._enablerView.render().el);
  //   this._setAnimatedFormView();
  // },

  _genAnimatedFormView: function () {
    this._animatedFormView = new Backbone.Form({
      model: this._animatedFormModel
    });

    this._animatedFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._animatedFormView.render().el);
  },

  _removeAnimatedFormView: function () {
    if (this._animatedFormView) {
      this._animatedFormView.remove();
      this._animatedFormView.$el.empty();
    }
  },

  clean: function () {
    this._removeAnimatedFormView();
    CoreView.prototype.clean.call(this);
  }
});
