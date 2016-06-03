var cdb = require('cartodb.js');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleLabelsFormModel = require('./style-labels-properties-form-model');

module.exports = cdb.core.View.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
    this._configModel = opts.configModel;

    this._labelsFormModel = new StyleLabelsFormModel(
      this._styleModel.get('labels'),
      {
        parse: true,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        styleModel: this._styleModel
      }
    );

    this._enablerModel = new Backbone.Model({
      enabler: this._styleModel.get('labels').enabled
    });

    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this._initLabelsEnablerView();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:animated', function () {
      var isAnimatedEnabled = this._styleModel.get('animated').enabled;
      if (isAnimatedEnabled) {
        this._enablerView.setValue(false);
      }
    }, this);
    this.add_related_model(this._styleModel);
  },

  _initLabelsEnablerView: function () {
    var helpMessage = _t('editor.style.components.labels-enabled.not-with-animated');
    var geom = this._querySchemaModel.getGeometry();
    var isAnimatedVisible = geom && geom.getSimpleType() === 'point';

    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: _t('editor.style.components.labels-enabled.label'),
      help: isAnimatedVisible ? helpMessage : '',
      key: 'enabler'
    });

    this._enablerModel.bind('change', this._setLabelsFormView, this);
    this.add_related_model(this._enablerModel);
    this.$el.append(this._enablerView.render().el);

    this._setLabelsFormView();
  },

  _setLabelsFormView: function () {
    var isEnabled = this._enablerModel.get('enabler');
    this._updateFormModel();
    if (isEnabled) {
      this._genLabelsFormView();
    } else {
      this._removeLabelsFormView();
    }
  },

  _updateFormModel: function () {
    this._labelsFormModel.set('enabled', this._enablerModel.get('enabler'));
  },

  _genLabelsFormView: function () {
    this._labelsFormView = new Backbone.Form({
      className: 'Editor-formInner--nested',
      model: this._labelsFormModel
    });

    this._labelsFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._labelsFormView.render().el);
  },

  _removeLabelsFormView: function () {
    if (this._labelsFormView) {
      this._labelsFormView.remove();
      this._labelsFormView.$el.empty();
    }
  },

  clean: function () {
    this._removeLabelsFormView();
    cdb.core.View.prototype.clean.call(this);
  }
});
