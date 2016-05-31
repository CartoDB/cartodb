var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleAnimatedFormModel = require('./style-animated-properties-form-model');

module.exports = cdb.core.View.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._styleModel = opts.styleModel;
    this._configModel = opts.configModel;

    this._animatedFormModel = new StyleAnimatedFormModel(
      this._styleModel.get('animated'),
      {
        parse: true,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        styleModel: this._styleModel
      }
    );

    this._enablerModel = new Backbone.Model({
      enabler: this._styleModel.get('animated').enabled
    });

    this._initBinds();
  },

  render: function () {
    this._initAnimatedEnablerView();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:labels', function () {
      var isLabelsEnabled = this._styleModel.get('labels').enabled;
      if (isLabelsEnabled) {
        this._enablerView.setValue(false);
      }
    }, this);
    this.add_related_model(this._styleModel);
  },

  _initAnimatedEnablerView: function () {
    var alreadyTorqueLayer = this._layerDefinitionsCollection.isThereAnyTorqueLayer();
    var isAnimatedEnabled = this._enablerModel.get('enabler');

    var enablerOpts = {
      model: this._enablerModel,
      title: _t('editor.style.components.animated-enabled.label'),
      help: _t('editor.style.components.animated-enabled.not-with-labels'),
      key: 'enabler'
    };

    if (!isAnimatedEnabled) {
      _.extend(
        enablerOpts, {
          disabled: alreadyTorqueLayer,
          help: alreadyTorqueLayer ? _t('editor.style.components.animated-enabled.already-one-torque') : _t('editor.style.components.animated-enabled.not-with-labels')
        }
      );
    }

    this._enablerView = new Backbone.Form.editors.Enabler(enablerOpts);
    this._enablerModel.bind('change', this._setAnimatedFormView, this);
    this.add_related_model(this._enablerModel);

    this.$el.append(this._enablerView.render().el);
    this._setAnimatedFormView();
  },

  _setAnimatedFormView: function () {
    this._updateFormModel();
    if (this._enablerModel.get('enabler')) {
      this._genAnimatedFormView();
    } else {
      this._removeAnimatedFormView();
    }
  },

  _updateFormModel: function () {
    this._animatedFormModel.set('enabled', this._enablerModel.get('enabler'));
  },

  _genAnimatedFormView: function () {
    this._animatedFormView = new Backbone.Form({
      className: 'Editor-formInner--nested',
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
    cdb.core.View.prototype.clean.call(this);
  }
});
