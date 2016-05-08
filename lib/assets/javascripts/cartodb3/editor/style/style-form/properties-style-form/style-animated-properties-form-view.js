var cdb = require('cartodb.js');
var _ = require('underscore');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleAnimatedFormModel = require('./style-animated-properties-form-model');

module.exports = cdb.core.View.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerTableModel = opts.layerTableModel;
    this._styleModel = opts.styleModel;
  },

  render: function () {
    this._initAnimatedEnabler();
    return this;
  },

  _initAnimatedEnabler: function () {
    this._enablerModel = new Backbone.Model({
      enabler: this._styleModel.get('animated').enabled
    });

    this._enablerView = new Backbone.Form.editors.Enabler({
      model: this._enablerModel,
      title: _t('editor.style.components.animated-enabled'),
      key: 'enabler'
    });

    this._enablerModel.bind('change', this._setAnimatedFormView, this);
    this._setAnimatedFormView();
    this.$el.append(this._enablerView.render().el);
  },

  _setAnimatedFormView: function () {
    var isEnabled = this._enablerModel.get('enabler');
    if (isEnabled) {
      this._genAnimatedFormView();
    } else {
      this._removeAnimatedFormView();
    }

    var d = this._styleModel.get('animated');
    this._styleModel.set('animated', _.extend(d, { enabled: isEnabled }));
  },

  _genAnimatedFormView: function () {
    this._animatedFormModel = new StyleAnimatedFormModel({}, {
      layerTableModel: this._layerTableModel,
      styleModel: this._styleModel
    });

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
