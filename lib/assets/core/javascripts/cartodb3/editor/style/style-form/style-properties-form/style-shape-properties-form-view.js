var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
require('../../../../components/form-components/index');
var StyleShapeFormModel = require('./style-shape-properties-form-model');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'modals',
  'queryGeometryModel',
  'querySchemaModel',
  'styleModel',
  'userModel'
];

module.exports = CoreView.extend({

  className: 'u-tSpace--m',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._queryGeometryModel = opts.queryGeometryModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._styleModel = opts.styleModel;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._removeFormView();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._styleModel.bind('change:style', function () {
      var style = this._styleModel.get('style');
      this._styleModel.setFill(style);
      this.render();
    }, this);
    this._styleModel.bind('change:method', this.render, this);
    this.add_related_model(this._styleModel);
  },

  _initViews: function () {
    this._shapeFormModel = new StyleShapeFormModel(
      {
        type: this._styleModel.get('type'),
        geom: this._queryGeometryModel.get('simple_geom'),
        style: this._styleModel.get('style'),
        fill: this._styleModel.get('fill'),
        stroke: this._styleModel.get('stroke'),
        blending: this._styleModel.get('blending'),
        method: this._styleModel.get('method')
      },
      {
        parse: true,
        queryGeometryModel: this._queryGeometryModel,
        querySchemaModel: this._querySchemaModel,
        configModel: this._configModel,
        userModel: this._userModel,
        modals: this._modals,
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
    CoreView.prototype.clean.call(this);
  }
});
