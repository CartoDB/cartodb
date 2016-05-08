var cdb = require('cartodb.js');
var StylePropertiesFormView = require('./properties-style-form/style-properties-form-view');
var StyleAggregationFormView = require('./aggregation-style-form/aggregation-style-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._layerTableModel = opts.layerTableModel;
    this._styleModel = opts.styleModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:type', this.render, this);
    this.add_related_model(this._styleModel);
  },

  _initViews: function () {
    if (this._styleModel.get('type') !== 'simple') {
      var aggregationFormView = new StyleAggregationFormView({
        styleModel: this._styleModel,
        layerTableModel: this._layerTableModel
      });

      this.addView(aggregationFormView);
      this.$el.append(aggregationFormView.render().el);
    }

    var styleFormView = new StylePropertiesFormView({
      styleModel: this._styleModel,
      layerTableModel: this._layerTableModel
    });

    this.addView(styleFormView);
    this.$el.append(styleFormView.render().el);
  }
});
