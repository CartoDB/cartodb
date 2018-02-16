var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
require('builder/components/form-components/index');
var StyleShapeFormModel = require('./style-aggregation-properties-form-model');
var template = require('./style-aggregation-form.tpl');

module.exports = CoreView.extend({
  module: 'editor/style/style-form/style-aggregation-form/style-aggregation-form-view',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._queryGeometryModel = opts.queryGeometryModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
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
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        styleModel: this._styleModel,
        configModel: this._configModel,
        userModel: this._userModel,
        modals: this._modals
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
    CoreView.prototype.clean.call(this);
  }

});
