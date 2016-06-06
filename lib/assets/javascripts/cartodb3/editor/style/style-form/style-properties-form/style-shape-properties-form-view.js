var cdb = require('cartodb.js');
var Backbone = require('backbone');
require('../../../../components/form-components/index');
var StyleShapeFormModel = require('./style-shape-properties-form-model');

module.exports = cdb.core.View.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this._shapeFormModel = new StyleShapeFormModel(
      {
        type: this._styleModel.get('type'),
        geom: this._querySchemaModel.getGeometry(),
        fill: this._styleModel.get('fill'),
        stroke: this._styleModel.get('stroke'),
        blending: this._styleModel.get('blending')
      },
      {
        parse: true,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        styleModel: this._styleModel
      }
    );

    this._shapeFormView = new Backbone.Form({
      model: this._shapeFormModel
    });

    this._shapeFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._shapeFormView.render().el);
  },

  _removeFormView: function () {
    if (this._shapeFormView) {
      this._shapeFormView.remove();
    }
  },

  clean: function () {
    this._removeFormView();
    cdb.core.View.prototype.clean.call(this);
  }
});
