var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleLabelsFormModel = require('./style-labels-properties-form-model');

module.exports = cdb.core.View.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerTableModel = opts.layerTableModel;
    this._styleModel = opts.styleModel;

    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this._initLabelsEnabler();
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

  _initLabelsEnabler: function () {
    this._enablerModel = new Backbone.Model({
      enabler: this._styleModel.get('labels').enabled
    });

    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: _t('editor.style.components.labels-enabled.label'),
      help: _t('editor.style.components.labels-enabled.not-with-animated'),
      key: 'enabler'
    });

    this._enablerModel.bind('change', this._setLabelsFormView, this);
    this.$el.append(this._enablerView.render().el);

    this._setLabelsFormView();
  },

  _setLabelsFormView: function () {
    var isEnabled = this._enablerModel.get('enabler');
    if (isEnabled) {
      this._genLabelsFormView();
    } else {
      this._removeLabelsFormView();
    }

    this._updateLabelsAttrs();
  },

  _updateLabelsAttrs: function () {
    var d = this._styleModel.attributes.labels;
    this._styleModel.set(
      'labels',
      _.extend(
        d,
        { enabled: this._enablerModel.get('enabler') }
      )
    );
    this._styleModel.trigger('change:labels');
  },

  _genLabelsFormView: function () {
    this._labelsFormModel = new StyleLabelsFormModel({}, {
      layerTableModel: this._layerTableModel,
      styleModel: this._styleModel
    });

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
