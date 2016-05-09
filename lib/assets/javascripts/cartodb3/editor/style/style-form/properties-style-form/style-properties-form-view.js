var cdb = require('cartodb.js');
var StyleLabelsPropertiesFormView = require('./style-labels-properties-form-view');
var StyleAnimatedPropertiesFormView = require('./style-animated-properties-form-view');
var template = require('./style-properties-form.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._layerTableModel = opts.layerTableModel;
    this._styleModel = opts.styleModel;
  },

  render: function () {
    var stepNumber = this._styleModel.get('type') !== 'simple' ? 3 : 2;
    this.$el.html(
      template({
        stepNumber: stepNumber
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function () {
    // TODO: shape form view

    var labelsFormView = new StyleLabelsPropertiesFormView({
      styleModel: this._styleModel,
      layerTableModel: this._layerTableModel
    });
    this.addView(labelsFormView);
    this.$('.js-propertiesForm').append(labelsFormView.render().el);

    var animatedFormView = new StyleAnimatedPropertiesFormView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      styleModel: this._styleModel,
      layerTableModel: this._layerTableModel
    });
    this.addView(animatedFormView);
    this.$('.js-propertiesForm').append(animatedFormView.render().el);
  }

});
