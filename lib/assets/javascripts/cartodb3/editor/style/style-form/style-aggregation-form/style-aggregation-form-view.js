var cdb = require('cartodb.js');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleShapeFormModel = require('./style-aggregation-properties-form-model');
var template = require('./style-aggregation-form.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._aggrFormModel = new StyleShapeFormModel(
      this._styleModel.get('aggregation'),
      {
        querySchemaModel: this._querySchemaModel,
        styleModel: this._styleModel
      }
    );

    this._aggrFormView = new Backbone.Form({
      model: this._aggrFormModel
    });

    this._aggrFormView.bind('change', function () {
      this.commit();
    });

    this.$('.js-aggregationForm').append(this._aggrFormView.render().el);
  },

  _removeFormView: function () {
    if (this._aggrFormView) {
      this._aggrFormView.remove();
    }
  },

  clean: function () {
    this._removeFormView();
    cdb.core.View.prototype.clean.call(this);
  }

});
